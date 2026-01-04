#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "../include/sll.h"

// Create a new Singly Linked List
SLL* sll_create() {
    SLL *list = (SLL*)malloc(sizeof(SLL));
    if (!list) {
        fprintf(stderr, "Memory allocation failed for SLL\n");
        exit(1);
    }
    list->head = NULL;
    list->tail = NULL;
    list->size = 0;
    return list;
}

// Insert a word at the end of the list
void sll_insert(SLL *list, const char *word) {
    if (!list || !word) return;
    
    SLLNode *new_node = (SLLNode*)malloc(sizeof(SLLNode));
    if (!new_node) {
        fprintf(stderr, "Memory allocation failed for SLL node\n");
        exit(1);
    }
    
    // Allocate memory and copy the word
    new_node->word = (char*)malloc(strlen(word) + 1);
    if (!new_node->word) {
        fprintf(stderr, "Memory allocation failed for word\n");
        free(new_node);
        exit(1);
    }
    strcpy(new_node->word, word);
    new_node->next = NULL;
    
    // Insert at the end
    if (list->tail) {
        list->tail->next = new_node;
        list->tail = new_node;
    } else {
        list->head = new_node;
        list->tail = new_node;
    }
    
    list->size++;
}

// Traverse the list and apply callback to each word
void sll_traverse(SLL *list, void (*callback)(const char *)) {
    if (!list || !callback) return;
    
    SLLNode *current = list->head;
    while (current) {
        callback(current->word);
        current = current->next;
    }
}

// Get the size of the list
int sll_size(SLL *list) {
    return list ? list->size : 0;
}

// Free the entire list
void sll_free(SLL *list) {
    if (!list) return;
    
    SLLNode *current = list->head;
    while (current) {
        SLLNode *temp = current;
        current = current->next;
        free(temp->word);
        free(temp);
    }
    free(list);
}
