#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "../include/queue.h"

// Create a new queue with maximum size
Queue* queue_create(int max_size) {
    Queue *queue = (Queue*)malloc(sizeof(Queue));
    if (!queue) {
        fprintf(stderr, "Memory allocation failed for Queue\n");
        exit(1);
    }
    queue->front = NULL;
    queue->rear = NULL;
    queue->size = 0;
    queue->max_size = max_size;
    return queue;
}

// Add word to the rear of the queue
void enqueue(Queue *queue, const char *word) {
    if (!queue || !word) return;
    
    
    if (queue->size >= queue->max_size) {
        char *removed = dequeue(queue);
        free(removed);
    }
    
    QueueNode *new_node = (QueueNode*)malloc(sizeof(QueueNode));
    if (!new_node) {
        fprintf(stderr, "Memory allocation failed for Queue node\n");
        exit(1);
    }
    
    new_node->word = (char*)malloc(strlen(word) + 1);
    if (!new_node->word) {
        fprintf(stderr, "Memory allocation failed for word in queue\n");
        free(new_node);
        exit(1);
    }
    strcpy(new_node->word, word);
    new_node->next = NULL;
    
    if (queue->rear) {
        queue->rear->next = new_node;
        queue->rear = new_node;
    } else {
        queue->front = new_node;
        queue->rear = new_node;
    }
    
    queue->size++;
}

// Remove and return word from the front of the queue
char* dequeue(Queue *queue) {
    if (!queue || !queue->front) return NULL;
    
    QueueNode *temp = queue->front;
    char *word = temp->word;
    
    queue->front = queue->front->next;
    if (!queue->front) {
        queue->rear = NULL;
    }
    
    free(temp);
    queue->size--;
    
    return word;
}

// Get current size of the queue
int queue_size(Queue *queue) {
    return queue ? queue->size : 0;
}

// Check if queue is full
int queue_is_full(Queue *queue) {
    return queue && (queue->size >= queue->max_size);
}

// Convert queue to array (for trigram extraction)
char** queue_to_array(Queue *queue) {
    if (!queue || queue->size == 0) return NULL;
    
    char **array = (char**)malloc(queue->size * sizeof(char*));
    if (!array) {
        fprintf(stderr, "Memory allocation failed for queue array\n");
        exit(1);
    }
    
    QueueNode *current = queue->front;
    int i = 0;
    while (current) {
        array[i] = current->word;
        current = current->next;
        i++;
    }
    
    return array;
}

// Free the entire queue
void queue_free(Queue *queue) {
    if (!queue) return;
    
    while (queue->front) {
        char *word = dequeue(queue);
        free(word);
    }
    free(queue);
}
