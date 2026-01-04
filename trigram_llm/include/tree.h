#ifndef TREE_H
#define TREE_H

typedef struct TreeNode {
    char *word;
    int count;
    struct TreeNode **children;
    int num_children;
    int capacity;
} TreeNode;

typedef struct {
    TreeNode *root;
    int total_trigrams;
} LanguageModel;

// Function declarations 
LanguageModel* lm_create();
void lm_insert_trigram(LanguageModel *model, const char *w1, const char *w2, const char *w3);
TreeNode* find_child(TreeNode *node, const char *word);
TreeNode* add_child(TreeNode *node, const char *word);

// Prediction result structure
typedef struct {
    char *word;
    float probability;
    int count;
} PredictionResult;

char* lm_predict_next_word(LanguageModel *model, const char *w1, const char *w2, float *probability);
PredictionResult* lm_predict_top_n(LanguageModel *model, const char *w1, const char *w2, int n, int *result_count);
void free_prediction_results(PredictionResult *results, int count);
void lm_print_statistics(LanguageModel *model);
void lm_free(LanguageModel *model);
void tree_node_free(TreeNode *node);


int lm_save_to_file(LanguageModel *model, const char *filename);
LanguageModel* lm_load_from_file(const char *filename);

#endif
