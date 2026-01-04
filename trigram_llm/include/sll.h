#ifndef SLL_H
#define SLL_H

typedef struct SLLNode {
    char *word;
    struct SLLNode *next;
} SLLNode;

// Singly Linked List structure
typedef struct {
    SLLNode *head;
    SLLNode *tail;
    int size;
} SLL;

// Function declarations
SLL* sll_create();
void sll_insert(SLL *list, const char *word);
void sll_traverse(SLL *list, void (*callback)(const char *));
void sll_free(SLL *list);
int sll_size(SLL *list);

#endif 
