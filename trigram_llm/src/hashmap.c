#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "../include/hashmap.h"

// Create a new hash map
HashMap* hashmap_create(int size) {
    HashMap *map = (HashMap*)malloc(sizeof(HashMap));
    if (!map) {
        fprintf(stderr, "Memory allocation failed for HashMap\n");
        exit(1);
    }
    
    map->size = size;
    map->count = 0;
    map->buckets = (HashNode**)calloc(size, sizeof(HashNode*));
    if (!map->buckets) {
        fprintf(stderr, "Memory allocation failed for HashMap buckets\n");
        free(map);
        exit(1);
    }
    
    return map;
}

// Hash function (djb2 algorithm)
unsigned int hash_function(const char *key, int size) {
    unsigned long hash = 5381;
    int c;
    
    while ((c = *key++)) {
        hash = ((hash << 5) + hash) + c; 
    }
    
    return hash % size;
}

void hashmap_insert(HashMap *map, const char *key) {
    if (!map || !key) return;
    
    unsigned int index = hash_function(key, map->size);
    HashNode *current = map->buckets[index];
    
    while (current) {
        if (strcmp(current->key, key) == 0) {
            current->value++;
            return;
        }
        current = current->next;
    }
    
    HashNode *new_node = (HashNode*)malloc(sizeof(HashNode));
    if (!new_node) {
        fprintf(stderr, "Memory allocation failed for HashNode\n");
        exit(1);
    }
    
    new_node->key = (char*)malloc(strlen(key) + 1);
    if (!new_node->key) {
        fprintf(stderr, "Memory allocation failed for hash key\n");
        free(new_node);
        exit(1);
    }
    strcpy(new_node->key, key);
    new_node->value = 1;
    new_node->next = map->buckets[index];
    map->buckets[index] = new_node;
    map->count++;
}

// Get frequency of a key
int hashmap_get(HashMap *map, const char *key) {
    if (!map || !key) return 0;
    
    unsigned int index = hash_function(key, map->size);
    HashNode *current = map->buckets[index];
    
    while (current) {
        if (strcmp(current->key, key) == 0) {
            return current->value;
        }
        current = current->next;
    }
    
    return 0;
}

// Get all entries (for sorting and display)
HashNode** hashmap_get_all_entries(HashMap *map, int *count) {
    if (!map || !count) return NULL;
    
    HashNode **entries = (HashNode**)malloc(map->count * sizeof(HashNode*));
    if (!entries) {
        fprintf(stderr, "Memory allocation failed for entries array\n");
        exit(1);
    }
    
    int idx = 0;
    for (int i = 0; i < map->size; i++) {
        HashNode *current = map->buckets[i];
        while (current) {
            entries[idx++] = current;
            current = current->next;
        }
    }
    
    *count = map->count;
    return entries;
}

// Print hash table statistics
void hashmap_print_stats(HashMap *map) {
    if (!map) return;
    
    int empty_buckets = 0;
    int max_chain_length = 0;
    int total_chain_length = 0;
    
    for (int i = 0; i < map->size; i++) {
        if (map->buckets[i] == NULL) {
            empty_buckets++;
        } else {
            int chain_length = 0;
            HashNode *current = map->buckets[i];
            while (current) {
                chain_length++;
                current = current->next;
            }
            total_chain_length += chain_length;
            if (chain_length > max_chain_length) {
                max_chain_length = chain_length;
            }
        }
    }
    
    float load_factor = (float)map->count / map->size;
    float avg_chain_length = (map->size - empty_buckets) > 0 ? 
                             (float)total_chain_length / (map->size - empty_buckets) : 0;
    
    printf("\n=== Hash Table Statistics ===\n");
    printf("Table size: %d\n", map->size);
    printf("Unique keys: %d\n", map->count);
    printf("Load factor: %.2f\n", load_factor);
    printf("Empty buckets: %d (%.1f%%)\n", empty_buckets, 
           (float)empty_buckets / map->size * 100);
    printf("Max chain length: %d\n", max_chain_length);
    printf("Avg chain length: %.2f\n", avg_chain_length);
}


void hashmap_free(HashMap *map) {
    if (!map) return;
    
    for (int i = 0; i < map->size; i++) {
        HashNode *current = map->buckets[i];
        while (current) {
            HashNode *temp = current;
            current = current->next;
            free(temp->key);
            free(temp);
        }
    }
    
    free(map->buckets);
    free(map);
}
