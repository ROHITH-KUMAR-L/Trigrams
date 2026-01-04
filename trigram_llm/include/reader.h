#ifndef READER_H
#define READER_H

#include "sll.h"
SLL* read_and_tokenize(const char *filename);
void preprocess_text(char *text);
int is_valid_word(const char *word);

#endif 
