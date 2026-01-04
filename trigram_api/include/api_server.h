#ifndef API_SERVER_H
#define API_SERVER_H

#include "tree.h"
#include "hashmap.h"

// Server configuration
#define API_PORT 8080
#define MAX_REQUEST_SIZE 4096

// Global model instance
extern LanguageModel *g_model;

// Server functions
int start_api_server(const char *model_path);
void stop_api_server();

// Request handlers
int handle_health(struct MHD_Connection *connection);
int handle_predict(struct MHD_Connection *connection, const char *upload_data, size_t upload_data_size);
int handle_stats(struct MHD_Connection *connection);

// Utility functions
int send_json_response(struct MHD_Connection *connection, const char *json, int status_code);
int send_cors_headers(struct MHD_Response *response);

#endif // API_SERVER_H
