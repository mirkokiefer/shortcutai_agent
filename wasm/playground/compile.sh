
clang --target=wasm32 -nostdlib -Wl,--no-entry -Wl,--export-all -o test3.wasm test3.c

clang main.c test3.c -o test3