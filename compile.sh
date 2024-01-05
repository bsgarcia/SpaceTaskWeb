# use webpack to compile the source code
npx webpack
# then add bundle.js to the html file using <script> tag in the head section
#sed -i 's/<\/head>/<script src="dist/bundle.js"><\/script><\/head>/' index.html
