#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "../include/reader.h"

// Preprocess text: convert to lowercase and remove punctuation
void preprocess_text(char *text) {
    if (!text) return;
    
    int i = 0, j = 0;
    while (text[i]) {
        if (isalpha(text[i]) || isspace(text[i])) {
            text[j++] = tolower(text[i]);
        } else if (ispunct(text[i])) {
            text[j++] = ' ';
        }
        i++;
    }
    text[j] = '\0';
}

// Check if word is valid (not empty, not just spaces)
int is_valid_word(const char *word) {
    if (!word || strlen(word) == 0) return 0;
    
    for (int i = 0; word[i]; i++) {
        if (!isspace(word[i])) return 1;
    }
    return 0;
}

// Read file and tokenize into words, storing in SLL
SLL* read_and_tokenize(const char *filename) {
    FILE *file = fopen(filename, "r");
    if (!file) {
        fprintf(stderr, "Error: Could not open file '%s'\n", filename);
        return NULL;
    }
    
    SLL *word_list = sll_create();
    char buffer[16384];  // Increased buffer size for efficient reading
    
    // Read file line by line
    while (fgets(buffer, sizeof(buffer), file)) {
        // Preprocess the line
        preprocess_text(buffer);
        
        // Tokenize into words
        char *token = strtok(buffer, " \t\n\r");
        while (token) {
            if (is_valid_word(token)) {
                sll_insert(word_list, token);
            }
            token = strtok(NULL, " \t\n\r");
        }
    }
    
    fclose(file);
    
    printf("Read %d words from file '%s'\n", sll_size(word_list), filename);
    return word_list;
}
