#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "../include/tree.h"

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

// Comparison function for sorting predictions
static int compare_predictions(const void *a, const void *b) {
    PredictionResult *pred_a = (PredictionResult*)a;
    PredictionResult *pred_b = (PredictionResult*)b;
    // Sort by count descending
    return pred_b->count - pred_a->count;
}

// Predict top N next words given two words
PredictionResult* lm_predict_top_n(LanguageModel *model, const char *w1, const char *w2, int n, int *result_count) {
    *result_count = 0;
    
    if (!model || !w1 || !w2) return NULL;
    
    // Navigate to level 2
    TreeNode *level1 = find_child(model->root, w1);
    if (!level1) return NULL;
    
    TreeNode *level2 = find_child(level1, w2);
    if (!level2 || level2->num_children == 0) return NULL;
    
    // Calculate total count
    int total_count = 0;
    for (int i = 0; i < level2->num_children; i++) {
        total_count += level2->children[i]->count;
    }
    
    // Allocate results array
    int num_results = (n < level2->num_children) ? n : level2->num_children;
    PredictionResult *results = (PredictionResult*)malloc(sizeof(PredictionResult) * num_results);
    
    if (!results) return NULL;
    
    // Copy all children to temporary array for sorting
    PredictionResult *all_predictions = (PredictionResult*)malloc(sizeof(PredictionResult) * level2->num_children);
    
    for (int i = 0; i < level2->num_children; i++) {
        all_predictions[i].word = level2->children[i]->word;
        all_predictions[i].count = level2->children[i]->count;
        all_predictions[i].probability = (float)level2->children[i]->count / total_count;
    }
    
    // Sort by count (descending)
    qsort(all_predictions, level2->num_children, sizeof(PredictionResult), compare_predictions);
    
    // Copy top N results
    for (int i = 0; i < num_results; i++) {
        results[i].word = strdup(all_predictions[i].word);
        results[i].count = all_predictions[i].count;
        results[i].probability = all_predictions[i].probability;
    }
    
    free(all_predictions);
    *result_count = num_results;
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
