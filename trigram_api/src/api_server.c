#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <microhttpd.h>
#include <signal.h>
#include <unistd.h>
#include "api_server.h"
#include "tree.h"
#include <time.h>

// Global model instance
LanguageModel *g_model = NULL;
struct MHD_Daemon *daemon_handle = NULL;

// Send JSON response with CORS headers
int send_json_response(struct MHD_Connection *connection, const char *json, int status_code) {
    struct MHD_Response *response;
    int ret;
    
    response = MHD_create_response_from_buffer(strlen(json), (void*)json, MHD_RESPMEM_MUST_COPY);
    
    // Add CORS headers
    MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
    MHD_add_response_header(response, "Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    MHD_add_response_header(response, "Access-Control-Allow-Headers", "Content-Type");
    MHD_add_response_header(response, "Content-Type", "application/json");
    
    ret = MHD_queue_response(connection, status_code, response);
    MHD_destroy_response(response);
    
    return ret;
}

// Handle OPTIONS requests for CORS preflight
int handle_options(struct MHD_Connection *connection) {
    struct MHD_Response *response;
    int ret;
    
    response = MHD_create_response_from_buffer(0, "", MHD_RESPMEM_PERSISTENT);
    
    MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
    MHD_add_response_header(response, "Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    MHD_add_response_header(response, "Access-Control-Allow-Headers", "Content-Type");
    
    ret = MHD_queue_response(connection, 200, response);
    MHD_destroy_response(response);
    
    return ret;
}

// Handle /health endpoint
int handle_health(struct MHD_Connection *connection) {
    char json[256];
    snprintf(json, sizeof(json), 
             "{\"status\":\"ok\",\"model_loaded\":%s}", 
             g_model ? "true" : "false");
    
    return send_json_response(connection, json, 200);
}

// Handle /stats endpoint
int handle_stats(struct MHD_Connection *connection) {
    if (!g_model) {
        return send_json_response(connection, "{\"error\":\"Model not loaded\"}", 500);
    }
    
    char json[512];
    snprintf(json, sizeof(json),
             "{\"total_trigrams\":%d,\"unique_first_words\":%d}",
             g_model->total_trigrams,
             g_model->root->num_children);
    
    return send_json_response(connection, json, 200);
}

// Handle /predict endpoint
int handle_predict(struct MHD_Connection *connection, const char *upload_data, size_t upload_data_size) {
    (void)upload_data_size;  // Unused - we rely on null terminator
    
    if (!g_model) {
        return send_json_response(connection, "{\"error\":\"Model not loaded\"}", 500);
    }
    
    if (!upload_data || strlen(upload_data) == 0) {
        return send_json_response(connection, "{\"error\":\"No data received\"}", 400);
    }
    
    // Parse JSON request (simple parsing for word1 and word2)
    // Format: {"word1":"operating","word2":"system"}
    
    char word1[100] = {0}, word2[100] = {0};
    
    // Simple JSON parsing (for production, use a proper JSON library)
    const char *w1_start = strstr(upload_data, "\"word1\":\"");
    const char *w2_start = strstr(upload_data, "\"word2\":\"");
    
    if (w1_start && w2_start) {
        w1_start += 9; // Skip "word1":"
        const char *w1_end = strchr(w1_start, '"');
        if (w1_end && (w1_end - w1_start) < 99) {
            int len = w1_end - w1_start;
            strncpy(word1, w1_start, len);
            word1[len] = '\0';
        }
        
        w2_start += 9; // Skip "word2":"
        const char *w2_end = strchr(w2_start, '"');
        if (w2_end && (w2_end - w2_start) < 99) {
            int len = w2_end - w2_start;
            strncpy(word2, w2_start, len);
            word2[len] = '\0';
        }
    }
    
    if (strlen(word1) == 0 || strlen(word2) == 0) {
        return send_json_response(connection, "{\"error\":\"Missing word1 or word2\"}", 400);
    }

    // Parse temperature (default 1.0)
    float temperature = 1.0f;
    const char *temp_start = strstr(upload_data, "\"temperature\":");
    if (temp_start) {
        temp_start += 14; // Skip "temperature":
        temperature = strtof(temp_start, NULL);
    }
    
    // Get predictions
    int result_count;
    PredictionResult *predictions = lm_predict_top_n(g_model, word1, word2, 5, &result_count, temperature);
    
    if (!predictions || result_count == 0) {
        return send_json_response(connection, "{\"predictions\":[]}", 200);
    }
    
    // Build JSON response
    char json[4096] = "{\"predictions\":[";
    
    for (int i = 0; i < result_count; i++) {
        char pred[256];
        snprintf(pred, sizeof(pred),
                 "%s{\"word\":\"%s\",\"probability\":%.4f,\"count\":%d}",
                 i > 0 ? "," : "",
                 predictions[i].word,
                 predictions[i].probability,
                 predictions[i].count);
        strcat(json, pred);
    }
    
    strcat(json, "]}");
    
    free_prediction_results(predictions, result_count);
    
    return send_json_response(connection, json, 200);
}

// Handle /generate endpoint (beam search for sentence completion)
int handle_generate(struct MHD_Connection *connection, const char *upload_data, size_t upload_data_size) {
    (void)upload_data_size;
    
    if (!g_model) {
        return send_json_response(connection, "{\"error\":\"Model not loaded\"}", 500);
    }
    
    if (!upload_data || strlen(upload_data) == 0) {
        return send_json_response(connection, "{\"error\":\"No data received\"}", 400);
    }
    
    // Parse JSON request
    char word1[100] = {0}, word2[100] = {0};
    int num_words = 5;
    int beam_width = 3;
    
    // Parse word1 and word2
    const char *w1_start = strstr(upload_data, "\"word1\":\"");
    const char *w2_start = strstr(upload_data, "\"word2\":\"");
    
    if (w1_start && w2_start) {
        w1_start += 9;
        const char *w1_end = strchr(w1_start, '"');
        if (w1_end && (w1_end - w1_start) < 99) {
            int len = w1_end - w1_start;
            strncpy(word1, w1_start, len);
            word1[len] = '\0';
        }
        
        w2_start += 9;
        const char *w2_end = strchr(w2_start, '"');
        if (w2_end && (w2_end - w2_start) < 99) {
            int len = w2_end - w2_start;
            strncpy(word2, w2_start, len);
            word2[len] = '\0';
        }
    }
    
    // Parse num_words
    const char *nw_start = strstr(upload_data, "\"num_words\":");
    if (nw_start) {
        nw_start += 12;
        num_words = atoi(nw_start);
        if (num_words < 1) num_words = 1;
        if (num_words > 10) num_words = 10;
    }
    
    // Parse beam_width
    const char *bw_start = strstr(upload_data, "\"beam_width\":");
    if (bw_start) {
        bw_start += 13;
        beam_width = atoi(bw_start);
        if (beam_width < 1) beam_width = 1;
        if (beam_width > 10) beam_width = 10;
    }
    
    if (strlen(word1) == 0 || strlen(word2) == 0) {
        return send_json_response(connection, "{\"error\":\"Missing word1 or word2\"}", 400);
    }
    
    // Get beam search results
    int result_count;
    BeamResult *completions = lm_beam_search(g_model, word1, word2, num_words, beam_width, &result_count);
    
    if (!completions || result_count == 0) {
        return send_json_response(connection, "{\"completions\":[]}", 200);
    }
    
    // Build JSON response
    char json[8192] = "{\"completions\":[";
    
    for (int i = 0; i < result_count; i++) {
        char comp[512];
        snprintf(comp, sizeof(comp),
                 "%s{\"sentence\":\"%s\",\"probability\":%.6f}",
                 i > 0 ? "," : "",
                 completions[i].sentence,
                 completions[i].probability);
        strcat(json, comp);
    }
    
    strcat(json, "]}");
    
    free_beam_results(completions, result_count);
    
    return send_json_response(connection, json, 200);
}

// Request context structure
struct ConnectionInfo {
    char *data;
    size_t size;
};

// Main request handler
static enum MHD_Result answer_to_connection(void *cls, struct MHD_Connection *connection,
                                           const char *url, const char *method,
                                           const char *version, const char *upload_data,
                                           size_t *upload_data_size, void **con_cls) {
    
    (void)cls;      // Unused
    (void)version;  // Unused
    
    // Handle OPTIONS for CORS
    if (strcmp(method, "OPTIONS") == 0) {
        return handle_options(connection);
    }
    
    // For POST requests, we need to handle upload data
    if (strcmp(method, "POST") == 0) {
        struct ConnectionInfo *con_info = *con_cls;
        
        if (con_info == NULL) {
            // First call - allocate connection info
            con_info = malloc(sizeof(struct ConnectionInfo));
            if (!con_info) return MHD_NO;
            
            con_info->data = NULL;
            con_info->size = 0;
            *con_cls = con_info;
            return MHD_YES;
        }
        
        if (*upload_data_size != 0) {
            // Data is being uploaded - accumulate it
            char *new_data = realloc(con_info->data, con_info->size + *upload_data_size + 1);
            if (!new_data) {
                free(con_info->data);
                free(con_info);
                return MHD_NO;
            }
            
            memcpy(new_data + con_info->size, upload_data, *upload_data_size);
            con_info->size += *upload_data_size;
            new_data[con_info->size] = '\0';
            con_info->data = new_data;
            
            *upload_data_size = 0;
            return MHD_YES;
        }
        
        // All data received - process it
        int ret;
        if (strcmp(url, "/predict") == 0) {
            ret = handle_predict(connection, con_info->data ? con_info->data : "", con_info->size);
        } else if (strcmp(url, "/generate") == 0) {
            ret = handle_generate(connection, con_info->data ? con_info->data : "", con_info->size);
        } else {
            ret = send_json_response(connection, "{\"error\":\"Not found\"}", 404);
        }
        
        // Cleanup
        if (con_info->data) free(con_info->data);
        free(con_info);
        *con_cls = NULL;
        
        return ret;
    }
    
    // Route handling for GET requests
    if (strcmp(url, "/health") == 0 && strcmp(method, "GET") == 0) {
        return handle_health(connection);
    }
    else if (strcmp(url, "/stats") == 0 && strcmp(method, "GET") == 0) {
        return handle_stats(connection);
    }
    else {
        return send_json_response(connection, "{\"error\":\"Not found\"}", 404);
    }
}

// Signal handler flag
volatile sig_atomic_t g_running = 1;

void handle_signal(int sig) {
    (void)sig;
    g_running = 0;
}

// Global port variable (can be overridden via command line)
int g_api_port = API_PORT;

// Start API server (modified to use global port)
int start_api_server_on_port(const char *model_path, int port) {
    printf("Loading model from %s...\n", model_path);
    
    g_model = lm_load_from_file(model_path);
    if (!g_model) {
        fprintf(stderr, "Failed to load model\n");
        return 1;
    }
    
    printf("Model loaded successfully!\n");
    printf("Starting API server on port %d...\n", port);
    
    daemon_handle = MHD_start_daemon(MHD_USE_SELECT_INTERNALLY, port, NULL, NULL,
                                    &answer_to_connection, NULL, MHD_OPTION_END);
    
    if (daemon_handle == NULL) {
        fprintf(stderr, "Failed to start server\n");
        return 1;
    }
    
    printf("✓ API server running at http://localhost:%d\n", port);
    printf("  GET  /health   - Health check\n");
    printf("  GET  /stats    - Model statistics\n");
    printf("  POST /predict  - Get word predictions\n");
    printf("  POST /generate - Generate sentence completions (beam search)\n");
    printf("\nServer running. Send SIGINT (Ctrl+C) or SIGTERM to stop.\n");

    // Setup signal handling
    struct sigaction sa;
    memset(&sa, 0, sizeof(sa));
    sa.sa_handler = handle_signal;
    sigaction(SIGINT, &sa, NULL);
    sigaction(SIGTERM, &sa, NULL);
    
    // Wait for signal
    while(g_running) {
        sleep(1);
    }
    
    return 0;
}

// Original function for backward compatibility
int start_api_server(const char *model_path) {
    return start_api_server_on_port(model_path, API_PORT);
}

// Stop API server
void stop_api_server() {
    if (daemon_handle) {
        MHD_stop_daemon(daemon_handle);
        daemon_handle = NULL;
    }
    
    if (g_model) {
        lm_free(g_model);
        g_model = NULL;
    }
    
    printf("Server stopped\n");
}

// Main function
int main(int argc, char *argv[]) {
    srand(time(NULL));
    const char *model_path = "../trigram_llm/output/model.bin";
    int port = API_PORT;
    
    // Parse arguments
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-p") == 0 && i + 1 < argc) {
            port = atoi(argv[++i]);
        } else if (strcmp(argv[i], "-m") == 0 && i + 1 < argc) {
            model_path = argv[++i];
        } else if (argv[i][0] != '-') {
            // Legacy: first non-flag argument is model path
            model_path = argv[i];
        }
    }
    
    int ret = start_api_server_on_port(model_path, port);
    stop_api_server();
    
    return ret;
}

