results=$(grep -r 'id:' ./src/components/translated/translatedComponents.tsx | cut -d "'" -f 2 | awk '!a[$0]++')

for result in $results; do
    files_with_result=$(grep -rl "$result" ./src/translations/)
    if [ -z "$files_with_result" ]; then
        echo "Result '$result' not found in any files"
    #else
        # echo "Result '$result' found in the following file(s):"
        # echo "$files_with_result"
    fi
done
