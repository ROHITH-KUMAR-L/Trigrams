#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "../include/tree.h"
#include <math.h>

#define INITIAL_CAPACITY 10

// Create a new tree node
TreeNode* tree_node_create(const char *word) {
    TreeNode *node = (TreeNode*)malloc(sizeof(TreeNode));
    if (!node) {
        fprintf(stderr, "Memory allocation failed for TreeNode\n");
        exit(1);
    }
    
    if (word) {
        node->word = (char*)malloc(strlen(word) + 1);
        if (!node->word) {
            fprintf(stderr, "Memory allocation failed for word in TreeNode\n");
            free(node);
            exit(1);
        }
        strcpy(node->word, word);
    } else {
        node->word = NULL;
    }
    
    node->count = 0;
    node->children = (TreeNode**)malloc(INITIAL_CAPACITY * sizeof(TreeNode*));
    if (!node->children) {
        fprintf(stderr, "Memory allocation failed for children array\n");
        free(node->word);
        free(node);
        exit(1);
    }
    node->num_children = 0;
    node->capacity = INITIAL_CAPACITY;
    
    return node;
}

// Create a new language model
LanguageModel* lm_create() {
    LanguageModel *model = (LanguageModel*)malloc(sizeof(LanguageModel));
    if (!model) {
        fprintf(stderr, "Memory allocation failed for LanguageModel\n");
        exit(1);
    }
    
    model->root = tree_node_create(NULL); // Root has no word
    model->total_trigrams = 0;
    model->vocabulary_size = 0;
    
    return model;
}

// Find a child node with given word
TreeNode* find_child(TreeNode *node, const char *word) {
    if (!node || !word) return NULL;
    
    for (int i = 0; i < node->num_children; i++) {
        if (strcmp(node->children[i]->word, word) == 0) {
            return node->children[i];
        }
    }
    
    return NULL;
}

// Add a child node with given word
TreeNode* add_child(TreeNode *node, const char *word) {
    if (!node || !word) return NULL;
    
    // Check if we need to expand capacity
    if (node->num_children >= node->capacity) {
        node->capacity *= 2;
        node->children = (TreeNode**)realloc(node->children, 
                                             node->capacity * sizeof(TreeNode*));
        if (!node->children) {
            fprintf(stderr, "Memory reallocation failed for children array\n");
            exit(1);
        }
    }
    
    TreeNode *child = tree_node_create(word);
    node->children[node->num_children++] = child;
    
    return child;
}

// Insert a trigram into the language model tree
void lm_insert_trigram(LanguageModel *model, const char *w1, const char *w2, const char *w3) {
    if (!model || !w1 || !w2 || !w3) return;
    
    // Level 1: Find or create node for first word
    TreeNode *level1 = find_child(model->root, w1);
    if (!level1) {
        level1 = add_child(model->root, w1);
    }
    
    // Level 2: Find or create node for second word
    TreeNode *level2 = find_child(level1, w2);
    if (!level2) {
        level2 = add_child(level1, w2);
    }
    
    // Level 3: Find or create node for third word and increment count
    TreeNode *level3 = find_child(level2, w3);
    if (!level3) {
        level3 = add_child(level2, w3);
    }
    level3->count++;
    
    model->total_trigrams++;
}

// Predict next word given two words
char* lm_predict_next_word(LanguageModel *model, const char *w1, const char *w2, float *probability) {
    if (!model || !w1 || !w2) return NULL;
    
    // Navigate to level 2
    TreeNode *level1 = find_child(model->root, w1);
    if (!level1) {
        if (probability) *probability = 0.0;
        return NULL;
    }
    
    TreeNode *level2 = find_child(level1, w2);
    if (!level2 || level2->num_children == 0) {
        if (probability) *probability = 0.0;
        return NULL;
    }
    
    // Find the most frequent third word
    TreeNode *best_child = NULL;
    int max_count = 0;
    int total_count = 0;
    
    for (int i = 0; i < level2->num_children; i++) {
        total_count += level2->children[i]->count;
        if (level2->children[i]->count > max_count) {
            max_count = level2->children[i]->count;
            best_child = level2->children[i];
        }
    }
    
    if (best_child && probability) {
        *probability = (float)max_count / total_count;
    }
    
    return best_child ? best_child->word : NULL;
}

// Comparison function for sorting predictions by count
static int compare_predictions(const void *a, const void *b) {
    PredictionResult *pred_a = (PredictionResult*)a;
    PredictionResult *pred_b = (PredictionResult*)b;
    // Sort by count descending
    return pred_b->count - pred_a->count;
}

// Comparison function for sorting predictions by probability
static int compare_predictions_prob(const void *a, const void *b) {
    PredictionResult *pred_a = (PredictionResult*)a;
    PredictionResult *pred_b = (PredictionResult*)b;
    if (pred_b->probability > pred_a->probability) return 1;
    if (pred_b->probability < pred_a->probability) return -1;
    return 0;
}

// Predict top N next words given two words (with Laplace smoothing)
PredictionResult* lm_predict_top_n(LanguageModel *model, const char *w1, const char *w2, int n, int *result_count, float temperature) {
    *result_count = 0;
    
    if (!model || !w1 || !w2) return NULL;
    
    // Get vocabulary size for smoothing (use minimum of 1 if not set)
    int V = (model->vocabulary_size > 0) ? model->vocabulary_size : 1;
    
    // Navigate to level 2
    TreeNode *level1 = find_child(model->root, w1);
    TreeNode *level2 = NULL;
    
    if (level1) {
        level2 = find_child(level1, w2);
    }
    
    // ============ STUPID BACKOFF IMPLEMENTATION ============
    // Backoff weight λ = 0.4 (standard for Stupid Backoff)
    const float BACKOFF_LAMBDA = 0.4f;
    
    // If full trigram context (w1, w2) not found, try backoff
    if (!level2 || level2->num_children == 0) {
        
        // --- BACKOFF LEVEL 1: Try bigram (just w2) ---
        // Search for w2 as a first-level child in any context
        TreeNode *bigram_node = NULL;
        int total_bigram_count = 0;
        
        // Look for w2 directly under root (as if it were w1)
        bigram_node = find_child(model->root, w2);
        
        if (bigram_node && bigram_node->num_children > 0) {
            // Found bigram context! Use children of w2 with backoff weight
            int num_candidates = bigram_node->num_children;
            PredictionResult *candidates = (PredictionResult*)malloc(sizeof(PredictionResult) * num_candidates);
            if (!candidates) return NULL;
            
            // Calculate total count for normalization
            for (int i = 0; i < num_candidates; i++) {
                total_bigram_count += bigram_node->children[i]->count;
            }
            
            // Build candidates with backoff probability
            for (int i = 0; i < num_candidates; i++) {
                candidates[i].word = bigram_node->children[i]->word;
                candidates[i].count = bigram_node->children[i]->count;
                // Stupid Backoff: P(w|w2) = λ * count(w2,w) / count(w2)
                candidates[i].probability = BACKOFF_LAMBDA * 
                    ((float)candidates[i].count / (float)total_bigram_count);
            }
            
            // Sort by probability
            qsort(candidates, num_candidates, sizeof(PredictionResult), compare_predictions_prob);
            
            // Return top N
            int final_count = (n < num_candidates) ? n : num_candidates;
            PredictionResult *results = (PredictionResult*)malloc(sizeof(PredictionResult) * final_count);
            if (!results) { free(candidates); return NULL; }
            
            for (int i = 0; i < final_count; i++) {
                results[i].word = strdup(candidates[i].word);
                results[i].count = candidates[i].count;
                results[i].probability = candidates[i].probability;
            }
            
            free(candidates);
            *result_count = final_count;
            return results;
        }
        
        // --- BACKOFF LEVEL 2: Fall back to unigram (most common words) ---
        // Use the most frequent first-level words as predictions
        int num_unigrams = model->root->num_children;
        if (num_unigrams == 0) return NULL;
        
        PredictionResult *candidates = (PredictionResult*)malloc(sizeof(PredictionResult) * num_unigrams);
        if (!candidates) return NULL;
        
        // Calculate total unigram count
        int total_unigram_count = 0;
        for (int i = 0; i < num_unigrams; i++) {
            // Sum up all children counts for each first word as a proxy for unigram frequency
            int word_count = 0;
            for (int j = 0; j < model->root->children[i]->num_children; j++) {
                word_count += model->root->children[i]->children[j]->count;
            }
            candidates[i].word = model->root->children[i]->word;
            candidates[i].count = word_count > 0 ? word_count : 1;
            total_unigram_count += candidates[i].count;
        }
        
        // Apply double backoff weight: λ² = 0.16
        float double_backoff = BACKOFF_LAMBDA * BACKOFF_LAMBDA;
        for (int i = 0; i < num_unigrams; i++) {
            candidates[i].probability = double_backoff * 
                ((float)candidates[i].count / (float)(total_unigram_count > 0 ? total_unigram_count : 1));
        }
        
        // Sort by count (highest first)
        qsort(candidates, num_unigrams, sizeof(PredictionResult), compare_predictions_prob);
        
        // Return top N
        int final_count = (n < num_unigrams) ? n : num_unigrams;
        PredictionResult *results = (PredictionResult*)malloc(sizeof(PredictionResult) * final_count);
        if (!results) { free(candidates); return NULL; }
        
        for (int i = 0; i < final_count; i++) {
            results[i].word = strdup(candidates[i].word);
            results[i].count = candidates[i].count;
            results[i].probability = candidates[i].probability;
        }
        
        free(candidates);
        *result_count = final_count;
        return results;
    }
    
    int num_candidates = level2->num_children;
    
    // Allocate temporary array for candidates
    PredictionResult *candidates = (PredictionResult*)malloc(sizeof(PredictionResult) * num_candidates);
    if (!candidates) return NULL;

    // --- Step 1: Calculate Scaled Probabilities ---
    float sum_exp = 0.0f;
    
    // If temperature is extremely low, treat as deterministic (T -> 0)
    // We'll just sort by count and take top N later
    int deterministic = (temperature < 0.1f);
    
    for (int i = 0; i < num_candidates; i++) {
        candidates[i].word = level2->children[i]->word;
        candidates[i].count = level2->children[i]->count;
        
        if (deterministic) {
            // Just use raw count as score
            candidates[i].probability = (float)candidates[i].count; 
        } else {
            // Scale: count^(1/T)
            candidates[i].probability = pow((float)candidates[i].count, 1.0f / temperature);
        }
        sum_exp += candidates[i].probability;
    }
    
    // Normalize if not deterministic (or even if deterministic, to get pseudo-probs)
    // For deterministic, we just want to sort, so normalization doesn't change order.
    // For sampling, we need valid probabilities summing to 1.
    if (!deterministic && sum_exp > 0) {
        for (int i = 0; i < num_candidates; i++) {
            candidates[i].probability /= sum_exp;
        }
    } else if (deterministic) {
        // Normalize linear counts just for display
        float total_count = 0;
        for (int i=0; i<num_candidates; i++) total_count += candidates[i].count;
        for (int i=0; i<num_candidates; i++) candidates[i].probability = (float)candidates[i].count / total_count;
    }

    // --- Step 2: Sort Candidates (Desc by Probability) ---
    // We need this for Top-P pruning AND deterministic selection
    qsort(candidates, num_candidates, sizeof(PredictionResult), compare_predictions_prob);
    
    // --- Step 3: Selection Strategy ---
    
    int final_count = 0;
    PredictionResult *results = (PredictionResult*)malloc(sizeof(PredictionResult) * n);
    
    if (deterministic) {
        // deterministic: just take Top N
        final_count = (n < num_candidates) ? n : num_candidates;
        for (int i = 0; i < final_count; i++) {
            results[i].word = strdup(candidates[i].word);
            results[i].count = candidates[i].count;
            results[i].probability = candidates[i].probability;
        }
    } else {
        // --- SAMPLING with Top-P Pruning ---
        
        // 3a. Top-P Pruning (Nucleus Sampling)
        // Keep candidates until cumulative prob >= 0.9
        float cumulative = 0.0f;
        int cutoff_idx = 0;
        float p_threshold = 0.9f;
        
        for (int i = 0; i < num_candidates; i++) {
            cumulative += candidates[i].probability;
            cutoff_idx = i;
            if (cumulative >= p_threshold) break;
        }
        int pool_size = cutoff_idx + 1; // Number of candidates in the pool
        
        // Re-normalize the pool probabilities
        float pool_sum = 0.0f;
        for (int i = 0; i < pool_size; i++) pool_sum += candidates[i].probability;
        for (int i = 0; i < pool_size; i++) candidates[i].probability /= pool_sum;
        
        // 3b. Independent Weighted Sampling
        // We want 'n' suggestions. We will sample N times independently.
        // To avoid duplicates in the output list, we track what we've added.
        
        // Simple O(N*Pool) approach to ensure uniqueness or just retry
        // Since N is small (5), linear scan is fine.
        
        int *selected_indices = (int*)calloc(n, sizeof(int)); // indices from 'candidates' array
        for(int k=0; k<n; k++) selected_indices[k] = -1;
        
        for (int i = 0; i < n; i++) {
            // Sampling loop with retries for uniqueness
            int picked_idx = -1;
            int retries = 0;
            const int MAX_RETRIES = 20;
            
            while (retries < MAX_RETRIES) {
                // Sample one item from pool [0..pool_size-1]
                float r = (float)rand() / (float)RAND_MAX;
                float acc = 0.0f;
                picked_idx = pool_size - 1; // Default to last
                
                for (int j = 0; j < pool_size; j++) {
                    acc += candidates[j].probability;
                    if (r <= acc) {
                        picked_idx = j;
                        break;
                    }
                }
                
                // Check if already selected
                int exists = 0;
                for (int k = 0; k < i; k++) {
                    if (selected_indices[k] == picked_idx) {
                        exists = 1;
                        break;
                    }
                }
                
                if (!exists) break; // Found unique
                retries++;
            }
            
            // If we failed to find unique after retries, just take the next available greedy one
            if (retries >= MAX_RETRIES) {
                // Find first unused
                for (int j = 0; j < pool_size; j++) {
                    int exists = 0;
                    for (int k = 0; k < i; k++) {
                         if (selected_indices[k] == j) { exists = 1; break; }
                    }
                    if (!exists) { picked_idx = j; break; }
                }
            }
            
            selected_indices[i] = picked_idx;
        }
        
        // Copy selected results
        // Also re-sort them by their prob so the user sees them best-to-worst (optional but requested)
        // Or keep them in sampling order? Requirement said: "Sort the final selected words by their scaled probability"
        
        // Let's first collect them
        final_count = 0;
        for(int i=0; i<n; i++) {
             int idx = selected_indices[i];
             if (idx == -1) continue; // Should not happen unless pool < n
             
             results[final_count].word = strdup(candidates[idx].word);
             results[final_count].count = candidates[idx].count;
             
             // Restore the scaled probability (relative to the full set, or pruned set?)
             // Usually users want to see the probability relative to the prediction context.
             // We'll use the value from 'candidates' which was renormalized to pool_sum=1.0.
             // That represents "probability among these top P candidates".
             results[final_count].probability = candidates[idx].probability;
             final_count++;
        }
        
        free(selected_indices);
        
        // Sort final results by probability descending
        qsort(results, final_count, sizeof(PredictionResult), compare_predictions_prob);
    }
    
    free(candidates);
    *result_count = final_count;
    return results;
}

// Free prediction results
void free_prediction_results(PredictionResult *results, int count) {
    if (!results) return;
    for (int i = 0; i < count; i++) {
        free(results[i].word);
    }
    free(results);
}


// Print model statistics
void lm_print_statistics(LanguageModel *model) {
    if (!model) return;
    
    printf("\n=== Language Model Statistics ===\n");
    printf("Total trigrams: %d\n", model->total_trigrams);
    printf("Unique first words: %d\n", model->root->num_children);
    
    int total_bigrams = 0;
    for (int i = 0; i < model->root->num_children; i++) {
        total_bigrams += model->root->children[i]->num_children;
    }
    printf("Unique bigrams (w1, w2): %d\n", total_bigrams);
}

// Free a tree node and all its children
void tree_node_free(TreeNode *node) {
    if (!node) return;
    
    for (int i = 0; i < node->num_children; i++) {
        tree_node_free(node->children[i]);
    }
    
    free(node->word);
    free(node->children);
    free(node);
}

// Free the language model
void lm_free(LanguageModel *model) {
    if (!model) return;
    
    tree_node_free(model->root);
    free(model);
}

// Save model to file
int lm_save_to_file(LanguageModel *model, const char *filename) {
    if (!model || !filename) return 0;
    
    FILE *file = fopen(filename, "wb");
    if (!file) {
        fprintf(stderr, "Error: Could not open file '%s' for writing\n", filename);
        return 0;
    }
    
    // Write header
    fwrite(&model->total_trigrams, sizeof(int), 1, file);
    fwrite(&model->vocabulary_size, sizeof(int), 1, file);
    int num_first_words = model->root->num_children;
    fwrite(&num_first_words, sizeof(int), 1, file);
    
    // Write tree structure
    for (int i = 0; i < num_first_words; i++) {
        TreeNode *node1 = model->root->children[i];
        
        // Write first word
        int len1 = strlen(node1->word) + 1;
        fwrite(&len1, sizeof(int), 1, file);
        fwrite(node1->word, sizeof(char), len1, file);
        fwrite(&node1->num_children, sizeof(int), 1, file);
        
        // Write second level
        for (int j = 0; j < node1->num_children; j++) {
            TreeNode *node2 = node1->children[j];
            
            int len2 = strlen(node2->word) + 1;
            fwrite(&len2, sizeof(int), 1, file);
            fwrite(node2->word, sizeof(char), len2, file);
            fwrite(&node2->num_children, sizeof(int), 1, file);
            
            // Write third level
            for (int k = 0; k < node2->num_children; k++) {
                TreeNode *node3 = node2->children[k];
                
                int len3 = strlen(node3->word) + 1;
                fwrite(&len3, sizeof(int), 1, file);
                fwrite(node3->word, sizeof(char), len3, file);
                fwrite(&node3->count, sizeof(int), 1, file);
            }
        }
    }
    
    fclose(file);
    return 1;
}

// Load model from file
LanguageModel* lm_load_from_file(const char *filename) {
    if (!filename) return NULL;
    
    FILE *file = fopen(filename, "rb");
    if (!file) {
        return NULL;
    }
    
    LanguageModel *model = lm_create();
    
    // Read header
    fread(&model->total_trigrams, sizeof(int), 1, file);
    fread(&model->vocabulary_size, sizeof(int), 1, file);
    int num_first_words;
    fread(&num_first_words, sizeof(int), 1, file);
    
    // Read tree structure
    for (int i = 0; i < num_first_words; i++) {
        // Read first word
        int len1;
        fread(&len1, sizeof(int), 1, file);
        char *word1 = (char*)malloc(len1);
        fread(word1, sizeof(char), len1, file);
        
        TreeNode *node1 = add_child(model->root, word1);
        free(word1);
        
        int num_second_words;
        fread(&num_second_words, sizeof(int), 1, file);
        
        // Read second level
        for (int j = 0; j < num_second_words; j++) {
            int len2;
            fread(&len2, sizeof(int), 1, file);
            char *word2 = (char*)malloc(len2);
            fread(word2, sizeof(char), len2, file);
            
            TreeNode *node2 = add_child(node1, word2);
            free(word2);
            
            int num_third_words;
            fread(&num_third_words, sizeof(int), 1, file);
            
            // Read third level
            for (int k = 0; k < num_third_words; k++) {
                int len3;
                fread(&len3, sizeof(int), 1, file);
                char *word3 = (char*)malloc(len3);
                fread(word3, sizeof(char), len3, file);
                
                TreeNode *node3 = add_child(node2, word3);
                free(word3);
                
                fread(&node3->count, sizeof(int), 1, file);
            }
        }
    }
    
    fclose(file);
    return model;
}

// ============= BEAM SEARCH FOR SENTENCE GENERATION =============

// Internal beam state structure
typedef struct {
    char *words[20];  // Max 20 words in sequence
    int num_words;
    float log_probability;
} BeamState;

// Comparison for sorting beams by probability (descending)
static int compare_beams(const void *a, const void *b) {
    BeamState *ba = (BeamState*)a;
    BeamState *bb = (BeamState*)b;
    if (bb->log_probability > ba->log_probability) return 1;
    if (bb->log_probability < ba->log_probability) return -1;
    return 0;
}

// Deep copy a beam state
static void copy_beam_state(BeamState *dest, BeamState *src) {
    dest->num_words = src->num_words;
    dest->log_probability = src->log_probability;
    for (int i = 0; i < src->num_words; i++) {
        dest->words[i] = strdup(src->words[i]);
    }
}

// Free beam state words
static void free_beam_state(BeamState *state) {
    for (int i = 0; i < state->num_words; i++) {
        free(state->words[i]);
        state->words[i] = NULL;
    }
    state->num_words = 0;
}

// Beam search for generating sentence completions
BeamResult* lm_beam_search(LanguageModel *model, const char *w1, const char *w2, 
                           int num_words, int beam_width, int *result_count) {
    *result_count = 0;
    if (!model || !w1 || !w2 || num_words <= 0 || beam_width <= 0) return NULL;
    
    // Limit to reasonable values
    if (num_words > 10) num_words = 10;
    if (beam_width > 10) beam_width = 10;
    
    // Allocate beam arrays
    BeamState *current_beams = (BeamState*)calloc(beam_width * 10, sizeof(BeamState));
    BeamState *next_beams = (BeamState*)calloc(beam_width * 10, sizeof(BeamState));
    if (!current_beams || !next_beams) {
        free(current_beams);
        free(next_beams);
        return NULL;
    }
    
    // Initialize with starting context
    current_beams[0].words[0] = strdup(w1);
    current_beams[0].words[1] = strdup(w2);
    current_beams[0].num_words = 2;
    current_beams[0].log_probability = 0.0f;
    int num_current_beams = 1;
    
    // Generate words iteratively
    for (int step = 0; step < num_words; step++) {
        int num_next_beams = 0;
        
        for (int b = 0; b < num_current_beams; b++) {
            BeamState *beam = &current_beams[b];
            
            // Get last two words as context
            const char *ctx1 = beam->words[beam->num_words - 2];
            const char *ctx2 = beam->words[beam->num_words - 1];
            
            // Get predictions for this context
            int pred_count;
            PredictionResult *preds = lm_predict_top_n(model, ctx1, ctx2, beam_width, &pred_count, 0.0f);
            
            if (preds && pred_count > 0) {
                for (int p = 0; p < pred_count && num_next_beams < beam_width * 5; p++) {
                    BeamState *new_beam = &next_beams[num_next_beams];
                    copy_beam_state(new_beam, beam);
                    
                    // Add new word
                    new_beam->words[new_beam->num_words] = strdup(preds[p].word);
                    new_beam->num_words++;
                    
                    // Update log probability (avoid log(0))
                    float prob = preds[p].probability > 0.0001f ? preds[p].probability : 0.0001f;
                    new_beam->log_probability += log(prob);
                    
                    num_next_beams++;
                }
                free_prediction_results(preds, pred_count);
            }
        }
        
        if (num_next_beams == 0) break;
        
        // Sort and keep top beam_width
        qsort(next_beams, num_next_beams, sizeof(BeamState), compare_beams);
        
        // Free old beams and swap
        for (int i = 0; i < num_current_beams; i++) {
            free_beam_state(&current_beams[i]);
        }
        
        num_current_beams = (num_next_beams < beam_width) ? num_next_beams : beam_width;
        for (int i = 0; i < num_current_beams; i++) {
            copy_beam_state(&current_beams[i], &next_beams[i]);
        }
        
        // Clear next beams
        for (int i = 0; i < num_next_beams; i++) {
            free_beam_state(&next_beams[i]);
        }
    }
    
    // Convert to results
    BeamResult *results = (BeamResult*)malloc(sizeof(BeamResult) * num_current_beams);
    if (!results) {
        for (int i = 0; i < num_current_beams; i++) free_beam_state(&current_beams[i]);
        free(current_beams);
        free(next_beams);
        return NULL;
    }
    
    for (int i = 0; i < num_current_beams; i++) {
        BeamState *beam = &current_beams[i];
        
        // Build sentence string
        int total_len = 0;
        for (int w = 0; w < beam->num_words; w++) {
            total_len += strlen(beam->words[w]) + 1;
        }
        
        results[i].sentence = (char*)malloc(total_len + 1);
        results[i].sentence[0] = '\0';
        
        for (int w = 0; w < beam->num_words; w++) {
            if (w > 0) strcat(results[i].sentence, " ");
            strcat(results[i].sentence, beam->words[w]);
        }
        
        results[i].probability = exp(beam->log_probability);
        free_beam_state(beam);
    }
    
    *result_count = num_current_beams;
    free(current_beams);
    free(next_beams);
    
    return results;
}

// Free beam results
void free_beam_results(BeamResult *results, int count) {
    if (!results) return;
    for (int i = 0; i < count; i++) {
        free(results[i].sentence);
    }
    free(results);
}
