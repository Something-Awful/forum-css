# Kill the existing build folder
rm -r build/

# Copy all the legacy CSS over
cp -r src/_legacy build/

# Build the new forums SASS, overwriting the legacy CSS (the forums SASS includes all of it)
sass --no-source-map src/forums/forums.scss build/forums.css