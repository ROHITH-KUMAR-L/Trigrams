
#ifndef HASHMAP_H
#define HASHMAP_H


#define HASHMAP_SIZE 1000003  

// Hash node for chaining
typedef struct HashNode {
    char *key;
    int value;
    struct HashNode *next;
} HashNode;


typedef struct {
    HashNode **buckets;
    int size;
    int count;  
} HashMap;


HashMap* hashmap_create(int size);
unsigned int hash_function(const char *key, int size);
void hashmap_insert(HashMap *map, const char *key);
int hashmap_get(HashMap *map, const char *key);
void hashmap_free(HashMap *map);
HashNode** hashmap_get_all_entries(HashMap *map, int *count);
void hashmap_print_stats(HashMap *map); 

#endif 