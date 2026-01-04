#ifndef QUEUE_H
#define QUEUE_H

typedef struct QueueNode {
    char *word;
    struct QueueNode *next;
} QueueNode;
typedef struct {
    QueueNode *front;
    QueueNode *rear;
    int size;
    int max_size; 
} Queue;

Queue* queue_create(int max_size);
void enqueue(Queue *queue, const char *word);
char* dequeue(Queue *queue);
int queue_size(Queue *queue);
int queue_is_full(Queue *queue);
void queue_free(Queue *queue);
char** queue_to_array(Queue *queue);

#endif 
