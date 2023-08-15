#include <stdio.h>

extern int addArray();

int main()
{
    int sum = addArray();
    printf("Sum: %d\n", sum);
    return 0;
}
