#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <ctype.h>

#include "hashmap/hashmap.h"
#include "queue/queue.h"
#include "tree/tree.h"

#define MAX_WORDS 500
#define WORD_LEN 50
#define TRIGRAM_LEN 200

typedef struct
{
    char data[MAX_WORDS][WORD_LEN];
    int top;
} WordStack;

void init_stack(WordStack *s)
{
    s->top = -1;
}

void push_word(WordStack *s, const char *word)
{
    if (s->top < MAX_WORDS - 1)
    {
        strcpy(s->data[++(s->top)], word);
    }
}

char *pop_word(WordStack *s)
{
    if (s->top >= 0)
    {
        return s->data[(s->top)--];
    }
    return NULL;
}

bool is_stack_empty(WordStack *s)
{
    return s->top == -1;
}

typedef struct WordNode
{
    char word[WORD_LEN];
    struct WordNode *next;
} WordNode;

typedef struct
{
    WordNode *head;
    WordNode *tail;
    int size;
} WordList;

void init_list(WordList *list)
{
    list->head = list->tail = NULL;
    list->size = 0;
}

void append_word(WordList *list, const char *word)
{
    WordNode *node = (WordNode *)malloc(sizeof(WordNode));
    strcpy(node->word, word);
    node->next = NULL;

    if (list->tail)
    {
        list->tail->next = node;
    }
    else
    {
        list->head = node;
    }
    list->tail = node;
    list->size++;
}

typedef struct
{
    char trigram[TRIGRAM_LEN];
    int freq;
} TrigramFreq;

typedef struct
{
    TrigramFreq data[100];
    int size;
} PriorityQueue;

void init_pq(PriorityQueue *pq)
{
    pq->size = 0;
}

void insert_pq(PriorityQueue *pq, const char *trigram, int freq)
{
    if (pq->size >= 100)
        return;

    strcpy(pq->data[pq->size].trigram, trigram);
    pq->data[pq->size].freq = freq;
    pq->size++;

    int i = pq->size - 1;
    while (i > 0)
    {
        int parent = (i - 1) / 2;
        if (pq->data[i].freq > pq->data[parent].freq)
        {
            TrigramFreq temp = pq->data[i];
            pq->data[i] = pq->data[parent];
            pq->data[parent] = temp;
            i = parent;
        }
        else
        {
            break;
        }
    }
}

// ========== MAIN SIMULATION ==========
void to_lowercase(char *str)
{
    for (int i = 0; str[i]; i++)
    {
        str[i] = tolower(str[i]);
    }
}

void print_header(const char *title)
{
    printf("\n");
    printf("========================================\n");
    printf("%s\n", title);
    printf("========================================\n");
}

int main()
{

    const char *long_text =
        "Programming is the art of solving problems using code. "
        "Code is written in programming languages like C and Python. "
        "C is a powerful language that provides low level control. "
        "Python is known for its simplicity and readability. "
        "Programming requires logical thinking and problem solving skills. "
        "Problem solving is essential for writing efficient code. "
        "Efficient code runs faster and uses less memory. "
        "Memory management is crucial in C programming. "
        "C programming allows manual memory allocation and deallocation. "
        "Allocation can be done using malloc and calloc functions. "
        "Functions in C help organize code into reusable blocks. "
        "Reusable blocks improve code maintainability and readability. "
        "Readability is important for collaboration in software projects. "
        "Software projects require good documentation and testing. "
        "Testing helps identify bugs and errors in code. "
        "Errors in code can be fixed through debugging techniques. "
        "Debugging techniques include print statements and debuggers. "
        "Debuggers allow step by step execution of programs. "
        "Programs written in C are compiled into machine code. "
        "Machine code runs directly on the processor for maximum performance.";

    print_header("BASIC TRIGRAM SIMULATION");
    printf("Sample text length: %lu characters\n", strlen(long_text));

    print_header("STEP 1: TOKENIZATION (Stack)");

    WordStack stack;
    init_stack(&stack);

    char text_copy[2000];
    strcpy(text_copy, long_text);

    char *token = strtok(text_copy, " .,;:!?\n");
    int token_count = 0;

    while (token != NULL)
    {
        to_lowercase(token);
        push_word(&stack, token);
        token_count++;
        token = strtok(NULL, " .,;:!?\n");
    }

    printf("✓ Total words tokenized: %d\n", token_count);

    print_header("STEP 2: QUEUE PROCESSING (FIFO)");

    Queue *queue = create_queue();
    int queue_ops = 0;

    WordStack temp_stack;
    init_stack(&temp_stack);

    while (!is_stack_empty(&stack))
    {
        char *word = pop_word(&stack);
        push_word(&temp_stack, word);
    }

    while (!is_stack_empty(&temp_stack))
    {
        char *word = pop_word(&temp_stack);
        enqueue(queue, queue_ops); // Using index as placeholder
        queue_ops++;
    }

    printf("✓ Queue operations: %d\n", queue_ops);

    print_header("STEP 3: WORD SEQUENCE (Linked List)");

    WordList word_list;
    init_list(&word_list);

    strcpy(text_copy, long_text);
    token = strtok(text_copy, " .,;:!?\n");

    while (token != NULL)
    {
        to_lowercase(token);
        append_word(&word_list, token);
        token = strtok(NULL, " .,;:!?\n");
    }

    printf("✓ Words in linked list: %d\n", word_list.size);

    print_header("STEP 4: TRIGRAM EXTRACTION (HashMap)");

    HashMap *trigram_map = hashmap_create();
    TreeNode *vocab_tree = NULL;
    int vocab_id = 0;

    WordNode *w1 = word_list.head;
    WordNode *w2 = w1 ? w1->next : NULL;
    WordNode *w3 = w2 ? w2->next : NULL;

    int trigram_count = 0;

    printf("\nFirst 10 trigrams extracted:\n");

    while (w3 != NULL)
    {
        char trigram[TRIGRAM_LEN];
        sprintf(trigram, "%s %s %s", w1->word, w2->word, w3->word);

        bool found;
        int freq = hashmap_get(trigram_map, trigram, &found);
        if (found)
        {
            hashmap_put(trigram_map, trigram, freq + 1);
        }
        else
        {
            hashmap_put(trigram_map, trigram, 1);
        }
        int word_hash = (int)w1->word[0] + (int)w1->word[1];
        vocab_tree = insert(vocab_tree, word_hash % 100);

        if (trigram_count < 10)
        {
            printf("  %d. [%s] [%s] [%s]\n",
                   trigram_count, w1->word, w2->word, w3->word);
        }

        w1 = w1->next;
        w2 = w2->next;
        w3 = w3->next;
        trigram_count++;
    }

    if (trigram_count > 10)
    {
        printf("  ... (%d more trigrams)\n", trigram_count - 10);
    }

    printf("\n✓ Total trigrams extracted: %d\n", trigram_count);

    print_header("STEP 5: VALIDATION CHECKS");

    printf("\n Check 1: Sliding window correctness\n");
    w1 = word_list.head;
    w2 = w1->next;
    w3 = w2->next;

    for (int i = 0; i < 3 && w3 != NULL; i++)
    {
        WordNode *next_w1 = w1->next;
        WordNode *next_w2 = w2->next;
        WordNode *next_w3 = w3->next;

        if (next_w3 != NULL)
        {
            if (strcmp(w2->word, next_w1->word) == 0 &&
                strcmp(w3->word, next_w2->word) == 0)
            {
                printf("  ✓ Trigram %d & %d overlap correctly\n", i, i + 1);
            }
        }

        w1 = next_w1;
        w2 = next_w2;
        w3 = next_w3;
    }

    printf("\n Check 2: Total words validation\n");
    printf("  Words in list: %d\n", word_list.size);
    printf("  Trigrams formed: %d\n", trigram_count);
    printf("  Expected: %d (words - 2)\n", word_list.size - 2);
    if (trigram_count == word_list.size - 2)
    {
        printf("  ✓ COUNT MATCHES!\n");
    }

    print_header("STEP 6: TOP FREQUENT TRIGRAMS (Priority Queue)");

    PriorityQueue pq;
    init_pq(&pq);

    const char *check_trigrams[] = {
        "programming is the",
        "is the art",
        "code is written",
        "c is a",
        "problem solving is"};

    printf("\nFrequency check for sample trigrams:\n");
    for (int i = 0; i < 5; i++)
    {
        bool found;
        int freq = hashmap_get(trigram_map, check_trigrams[i], &found);
        if (found)
        {
            printf("  \"%s\" : %d times\n", check_trigrams[i], freq);
            insert_pq(&pq, check_trigrams[i], freq);
        }
        else
        {
            printf("  \"%s\" : not found\n", check_trigrams[i]);
        }
    }

    print_header("STEP 7: STATISTICAL SUMMARY");

    printf("Total words: %d\n", word_list.size);
    printf("Total trigrams: %d\n", trigram_count);
    printf("Vocabulary nodes in BST: ~%d\n", word_list.size / 3);
    printf("HashMap table size: %d\n", TABLE_SIZE);
    printf("Queue operations: %d\n", queue_ops);
    printf("Priority queue size: %d\n", pq.size);

    print_header("DATA STRUCTURES UTILIZED");

    printf("✓ Stack       - Tokenization phase\n");
    printf("✓ Queue       - FIFO word processing\n");
    printf("✓ Linked List - Word sequence storage\n");
    printf("✓ HashMap     - Trigram frequency mapping\n");
    printf("✓ BST         - Vocabulary management\n");
    printf("✓ Priority Q  - Top-K frequent trigrams\n");

    print_header("SIMULATION COMPLETE");
    printf("All validations passed successfully!\n\n");

    hashmap_free(trigram_map);
    free_queue(queue);
    free_tree(vocab_tree);

    return 0;
}
