#ifndef TRIGRAM_H
#define TRIGRAM_H

#include "sll.h"
#include "hashmap.h"

typedef struct {
    char *word1;
    char *word2;
    char *word3;
} Trigram;

HashMap* generate_trigrams(SLL *word_list);
char* trigram_to_string(const char *w1, const char *w2, const char *w3);
void save_trigram_frequencies(HashMap *trigram_map, FILE *file, int limit);

#endif 
