#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "../include/trigram.h"
#include "../include/queue.h"

// Convert trigram to string key for hashing
char* trigram_to_string(const char *w1, const char *w2, const char *w3) {
    if (!w1 || !w2 || !w3) return NULL;
    
    int len = strlen(w1) + strlen(w2) + strlen(w3) + 3; // +3 for spaces and null
    char *key = (char*)malloc(len);
    if (!key) {
        fprintf(stderr, "Memory allocation failed for trigram key\n");
        exit(1);
    }
    
    snprintf(key, len, "%s %s %s", w1, w2, w3);
    return key;
}

// Generate trigrams using queue-based sliding window
HashMap* generate_trigrams(SLL *word_list) {
    if (!word_list || sll_size(word_list) < 3) {
        fprintf(stderr, "Not enough words to generate trigrams\n");
        return NULL;
    }
    
    HashMap *trigram_map = hashmap_create(HASHMAP_SIZE);
    Queue *window = queue_create(3);
    
    // Traverse the word list
    SLLNode *current = word_list->head;
    int trigram_count = 0;
    int total_words = sll_size(word_list);
    int progress_interval = total_words / 100;  // Show progress every 1%
    int words_processed = 0;
    
    printf("Generating trigrams from %d words", total_words);
    fflush(stdout);
    
    while (current) {
        enqueue(window, current->word);
        words_processed++;
        
        // Show progress for large datasets (every 1%)
        if (progress_interval > 0 && words_processed % progress_interval == 0) {
            printf(".");
            fflush(stdout);
        }
        
        // When window is full (size = 3), we have a trigram
        if (queue_size(window) == 3) {
            char **words = queue_to_array(window);
            char *trigram_key = trigram_to_string(words[0], words[1], words[2]);
            
            hashmap_insert(trigram_map, trigram_key);
            trigram_count++;
            
            free(trigram_key);
            free(words);
        }
        
        current = current->next;
    }
    
    queue_free(window);
    
    printf("\n");  // Newline after progress dots
    printf("Generated %d trigrams (%d unique)\n", trigram_count, trigram_map->count);
    return trigram_map;
}

// Comparison function for sorting
int compare_hash_nodes(const void *a, const void *b) {
    HashNode *node_a = *(HashNode**)a;
    HashNode *node_b = *(HashNode**)b;
    return node_b->value - node_a->value; // Descending order
}

// Helper: Swap two hash node pointers
static void swap_nodes(HashNode **a, HashNode **b) {
    HashNode *temp = *a;
    *a = *b;
    *b = temp;
}

// Helper: Heapify down for min-heap
static void min_heapify_down(HashNode **heap, int size, int idx) {
    int smallest = idx;
    int left = 2 * idx + 1;
    int right = 2 * idx + 2;
    
    if (left < size && heap[left]->value < heap[smallest]->value)
        smallest = left;
    if (right < size && heap[right]->value < heap[smallest]->value)
        smallest = right;
    
    if (smallest != idx) {
        swap_nodes(&heap[idx], &heap[smallest]);
        min_heapify_down(heap, size, smallest);
    }
}

// Helper: Heapify up for min-heap
static void min_heapify_up(HashNode **heap, int idx) {
    while (idx > 0) {
        int parent = (idx - 1) / 2;
        if (heap[parent]->value <= heap[idx]->value)
            break;
        swap_nodes(&heap[parent], &heap[idx]);
        idx = parent;
    }
}

// Save trigram frequencies to file (or stdout if file is NULL)
// Uses min-heap for efficient top-N selection: O(N log k) instead of O(N log N)
void save_trigram_frequencies(HashMap *trigram_map, FILE *file, int limit) {
    if (!trigram_map) return;
    
    int count;
    HashNode **entries = hashmap_get_all_entries(trigram_map, &count);
    
    FILE *out = file ? file : stdout;
    
    if (limit > 0 && limit < count) {
        // Use min-heap to find top N efficiently
        // Heap maintains the N largest elements seen so far
        HashNode **heap = (HashNode**)malloc(sizeof(HashNode*) * limit);
        int heap_size = 0;
        
        printf("Finding top %d trigrams (optimized)...\n", limit);
        
        for (int i = 0; i < count; i++) {
            if (heap_size < limit) {
                // Heap not full yet, just add
                heap[heap_size] = entries[i];
                min_heapify_up(heap, heap_size);
                heap_size++;
            } else if (entries[i]->value > heap[0]->value) {
                // Current entry is larger than smallest in heap
                // Replace root and heapify
                heap[0] = entries[i];
                min_heapify_down(heap, heap_size, 0);
            }
        }
        
        // Sort the heap for nice output (only sorting 'limit' items)
        qsort(heap, heap_size, sizeof(HashNode*), compare_hash_nodes);
        
        fprintf(out, "\n=== Top %d Trigrams ===\n", limit);
        for (int i = 0; i < heap_size; i++) {
            fprintf(out, "%2d. \"%s\" - %d occurrences\n", 
                    i + 1, heap[i]->key, heap[i]->value);
        }
        
        free(heap);
    } else {
        // No limit or limit >= count - sort everything
        qsort(entries, count, sizeof(HashNode*), compare_hash_nodes);
        
        if (limit > 0) {
            fprintf(out, "\n=== Top %d Trigrams ===\n", limit);
        } else {
            fprintf(out, "\n=== All Trigrams (Sorted by Frequency) ===\n");
        }
        
        int display_count = (limit > 0 && limit < count) ? limit : count;
        for (int i = 0; i < display_count; i++) {
            fprintf(out, "%2d. \"%s\" - %d occurrences\n", 
                    i + 1, entries[i]->key, entries[i]->value);
        }
    }
    
    free(entries);
}
