# bash script to rename .mjs to .js
mv js/main.mjs js/main.js

# rewrite index.html to use .js instead of .mjs
sed -i 's/main.mjs/main.js/g' index.html
