# Compiler and flags
CC = gcc
CFLAGS = -Wall -Wextra -I../trigram_llm/include -Iinclude -g
LDFLAGS = -lmicrohttpd

# Directories
SRC_DIR = src
OBJ_DIR = obj
MODEL_DIR = ../trigram_llm

# Source files
API_SRCS = $(SRC_DIR)/api_server.c
MODEL_SRCS = $(MODEL_DIR)/src/tree.c $(MODEL_DIR)/src/hashmap.c $(MODEL_DIR)/src/sll.c

# Object files
API_OBJS = $(OBJ_DIR)/api_server.o
MODEL_OBJS = $(OBJ_DIR)/tree.o $(OBJ_DIR)/hashmap.o $(OBJ_DIR)/sll.o

# Target executable
TARGET = trigram_api

# Default target
all: $(TARGET)

# Create object directory
$(OBJ_DIR):
	mkdir -p $(OBJ_DIR)

# Compile API sources
$(OBJ_DIR)/%.o: $(SRC_DIR)/%.c | $(OBJ_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

# Compile model sources
$(OBJ_DIR)/tree.o: $(MODEL_DIR)/src/tree.c | $(OBJ_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(OBJ_DIR)/hashmap.o: $(MODEL_DIR)/src/hashmap.c | $(OBJ_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(OBJ_DIR)/sll.o: $(MODEL_DIR)/src/sll.c | $(OBJ_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

# Link executable
$(TARGET): $(API_OBJS) $(MODEL_OBJS)
	$(CC) $(API_OBJS) $(MODEL_OBJS) -o $(TARGET) $(LDFLAGS)
	@echo "Build complete: ./$(TARGET)"

# Clean
clean:
	rm -rf $(OBJ_DIR) $(TARGET)
	@echo "Clean complete"

# Run server
run: $(TARGET)
	./$(TARGET)

.PHONY: all clean run
