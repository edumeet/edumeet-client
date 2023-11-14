#!/bin/bash

# Set the directory to the directory where the script is located
directory="./src/translations"

# Specify the specific JSON file (file1)
file1="$directory/en.json"

# Initialize an empty array to store the file names
files=()

# Iterate through JSON files in the directory and add their names to the array
for file in "$directory"/*.json; do
    files+=("$file")
done

# Loop through the files and compare their array keys
for file2 in "${files[@]}"; do
    if [ "$file1" != "$file2" ]; then
        filename1=$(basename "$file1")
        filename2=$(basename "$file2")

        # Replace dots with underscores in the filenames
        key1=${filename1//./_}
        key2=${filename2//./_}

        # Compare array keys using jq
        diff_result=$(jq --argjson file1 "$(jq -c 'keys_unsorted' "$file1")" --argjson file2 "$(jq -c 'keys_unsorted' "$file2")" -n '$file1 as $f1 | $file2 as $f2 | {"keys_only_in_file1": ($f1 - $f2), "keys_only_in_file2": ($f2 - $f1)}')

        # Store the diff result in the results object with modified keys
        key1=${key1//:/}  # Remove colons
        key2=${key2//:/}  # Remove colons
        results["$key1-$key2"]=$diff_result  # Use a different delimiter (e.g., hyphen) instead of colon

        # Merge the keys_only_in_file1 keys into file2 and remove keys_only_in_file2
        if [ -f "$file2" ]; then
            merged_keys=$(echo "$diff_result" | jq -r '.keys_only_in_file1[]')
            for key in $merged_keys; do
                jq --arg k "$key" '.[$k] = null' "$file2" > temp_file && mv temp_file "$file2"
            done
            unused_keys=$(echo "$diff_result" | jq -r '.keys_only_in_file2[]')
            for key in $unused_keys; do
                jq "del(.[\"$key\"])" "$file2" > temp_file && mv temp_file "$file2"
            done
        else
            echo "Warning: $file2 does not exist."
        fi

        # Echo the diff_result as it's created
        echo "Diff Result for $key1-$key2:"
        echo "$diff_result"
        echo "------"
    fi
done