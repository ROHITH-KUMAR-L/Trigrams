#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX 3


typedef struct {
    char data[MAX][30];
    int top;
} Stack;


typedef struct Node {
    char trigram[100];
    int freq;
    struct Node *next;
} Node;

Node *head = NULL;


void initStack(Stack *s) {
    s->top = -1;
}

void push(Stack *s, char *word) {
    if (s->top < MAX - 1) {
        s->top++;
        strcpy(s->data[s->top], word);
    }
}

void popBottom(Stack *s) {
    for (int i = 0; i < s->top; i++)
        strcpy(s->data[i], s->data[i + 1]);
    s->top--;
}


void insertTrigram(char *tri) {
    Node *temp = head;

    if (head == NULL) {
        head = (Node *)malloc(sizeof(Node));
        strcpy(head->trigram, tri);
        head->freq = 1;
        head->next = NULL;
        return;
    }

    while (temp) {
        if (strcmp(temp->trigram, tri) == 0) {
            temp->freq++;
            return;
        }
        if (temp->next == NULL)
            break;
        temp = temp->next;
    }

    Node *newNode = (Node *)malloc(sizeof(Node));
    strcpy(newNode->trigram, tri);
    newNode->freq = 1;
    newNode->next = NULL;
    temp->next = newNode;
}

int main() {
    char sentence[300];
    char *word;
    Stack s;

    initStack(&s);

    printf("Enter a sentence:\n");
    fgets(sentence, sizeof(sentence), stdin);

    word = strtok(sentence, " \n");

    while (word) {
        push(&s, word);

        if (s.top == 2) {
            char tri[100];
            sprintf(tri, "%s %s %s",
                    s.data[0], s.data[1], s.data[2]);
            insertTrigram(tri);
            popBottom(&s);   
        }

        word = strtok(NULL, " \n");
    }

    printf("\nTrigrams and Frequencies:\n");
    Node *temp = head;
    while (temp) {
        printf("%s %d\n", temp->trigram, temp->freq);
        temp = temp->next;
    }

    return 0;
}
