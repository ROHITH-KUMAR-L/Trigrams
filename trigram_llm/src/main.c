#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "../include/sll.h"
#include "../include/queue.h"
#include "../include/reader.h"
#include "../include/trigram.h"
#include "../include/hashmap.h"
#include "../include/tree.h"

#define INPUT_FILE "data/input.txt"
#define OUTPUT_FILE "output/result.txt"
#define MODEL_FILE "output/model.bin"

void save_results(const char *filename, HashMap *trigram_map, LanguageModel *model) {
    FILE *file = fopen(filename, "w");
    if (!file) {
        fprintf(stderr, "Error: Could not open output file '%s'\n", filename);
        return;
    }
    
    fprintf(file, "=== TRIGRAM-BASED STATISTICAL LANGUAGE MODEL ===\n\n");
    
    save_trigram_frequencies(trigram_map, file, 0);
    
    fprintf(file, "\nModel Statistics:\n");
    fprintf(file, "Total trigrams: %d\n", model->total_trigrams);
    fprintf(file, "Unique trigrams: %d\n", trigram_map->count);
    
    fclose(file);
    
    printf("\nResults saved to '%s'\n", filename);
}

void interactive_prediction(LanguageModel *model) {
    char word1[100], word2[100];
    
    printf("\n=== INTERACTIVE PREDICTION MODE ===\n");
    printf("Enter two words to predict the next word (or 'quit' to exit)\n\n");
    
    while (1) {
        printf("Enter first word: ");
        if (scanf("%99s", word1) != 1) break;
        
        if (strcmp(word1, "quit") == 0) break;
        
        printf("Enter second word: ");
        if (scanf("%99s", word2) != 1) break;
        
        if (strcmp(word2, "quit") == 0) break;
        
        int result_count;
        PredictionResult *predictions = lm_predict_top_n(model, word1, word2, 5, &result_count);
        
        if (predictions && result_count > 0) {
            printf("\nTop %d predictions for \"%s %s\":\n", result_count, word1, word2);
            for (int i = 0; i < result_count; i++) {
                printf("  %d. \"%s\" (%.2f%%, count: %d)\n", 
                       i + 1, 
                       predictions[i].word, 
                       predictions[i].probability * 100,
                       predictions[i].count);
            }
            printf("\n");
            free_prediction_results(predictions, result_count);
        } else {
            printf("No predictions available for \"%s %s\"\n\n", word1, word2);
        }
    }
}

int main(int argc, char *argv[]) {
    printf("=== TRIGRAM-BASED STATISTICAL LANGUAGE MODEL ===\n\n");
    
    // Parse command-line arguments
    int train_mode = 1; // Default: train mode
    
    if (argc > 1) {
        if (strcmp(argv[1], "--load") == 0 || strcmp(argv[1], "-l") == 0) {
            train_mode = 0;
        } else if (strcmp(argv[1], "--train") == 0 || strcmp(argv[1], "-t") == 0) {
            train_mode = 1;
        } else if (strcmp(argv[1], "--help") == 0 || strcmp(argv[1], "-h") == 0) {
            printf("Usage: %s [OPTIONS]\n\n", argv[0]);
            printf("Options:\n");
            printf("  --train, -t    Train a new model from input file (default)\n");
            printf("  --load, -l     Load pre-trained model from file\n");
            printf("  --help, -h     Show this help message\n\n");
            printf("Files:\n");
            printf("  Input:  %s\n", INPUT_FILE);
            printf("  Output: %s\n", OUTPUT_FILE);
            printf("  Model:  %s\n\n", MODEL_FILE);
            return 0;
        } else {
            fprintf(stderr, "Unknown option: %s\n", argv[1]);
            fprintf(stderr, "Use --help for usage information\n");
            return 1;
        }
    }
    
    LanguageModel *model = NULL;
    HashMap *trigram_map = NULL;
    
    if (train_mode) {
        printf("=== TRAINING MODE ===\n\n");
        
        // Step 1: Read and tokenize input file (using SLL)
        printf("Step 1: Reading and tokenizing input file...\n");
        SLL *word_list = read_and_tokenize(INPUT_FILE);
        if (!word_list) {
            fprintf(stderr, "Failed to read input file\n");
            return 1;
        }
        
        if (sll_size(word_list) < 3) {
            fprintf(stderr, "Error: Need at least 3 words to generate trigrams\n");
            sll_free(word_list);
            return 1;
        }
        
        // Step 2: Generate trigrams using Queue-based sliding window
        printf("\nStep 2: Generating trigrams using queue-based sliding window...\n");
        trigram_map = generate_trigrams(word_list);
        if (!trigram_map) {
            sll_free(word_list);
            return 1;
        }
        
        // Step 3: Display top trigrams
        save_trigram_frequencies(trigram_map, NULL, 10); // Print top 10 to stdout
        
        // Step 4: Build Tree-based Language Model
        printf("\nStep 3: Building tree-based language model...\n");
        model = lm_create();
        
        // Traverse word list again to build tree
        Queue *window = queue_create(3);
        SLLNode *current = word_list->head;
        
        while (current) {
            enqueue(window, current->word);
            
            if (queue_size(window) == 3) {
                char **words = queue_to_array(window);
                lm_insert_trigram(model, words[0], words[1], words[2]);
                free(words);
            }
            
            current = current->next;
        }
        
        queue_free(window);
        lm_print_statistics(model);
        
        // Step 5: Save results
        printf("\nStep 4: Saving results...\n");
        save_results(OUTPUT_FILE, trigram_map, model);
        
        // Step 6: Save model to file
        printf("\nStep 5: Saving trained model...\n");
        if (lm_save_to_file(model, MODEL_FILE)) {
            printf("✓ Model saved successfully! Use --load to skip training next time.\n");
        }
        
        // Cleanup word list
        sll_free(word_list);
        
    } else {
        printf("=== LOAD MODE ===\n\n");
        
        // Load pre-trained model
        printf("Loading pre-trained model from '%s'...\n", MODEL_FILE);
        model = lm_load_from_file(MODEL_FILE);
        
        if (!model) {
            fprintf(stderr, "\nError: Could not load model. Please train first using --train\n");
            return 1;
        }
        
        printf("\n✓ Model loaded successfully!\n");
        lm_print_statistics(model);
    }
    
    // Interactive prediction
    interactive_prediction(model);
    
    // Cleanup
    printf("\nCleaning up...\n");
    if (trigram_map) hashmap_free(trigram_map);
    lm_free(model);
    
    printf("Done!\n");
    return 0;
}
