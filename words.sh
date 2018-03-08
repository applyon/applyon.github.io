rm -rf ./search
mkdir search
for word in $(node words)
do
cat << EOF > "search/$word"
---
---
{% include s q='$word' %}
EOF
done
