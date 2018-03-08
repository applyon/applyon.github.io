JEKYLL_VERSION = 3.6.2
ccred="\\033[0;31m"
ccgreen="\\033[92m"
ccend="\\033[0m"
serve-docs:
	@echo   $(ccred) "Make sure github still follows JEKYLL_VERSION=${JEKYLL_VERSION}\033[0m" $(ccend)
	@echo  $(ccgreen) "https://pages.github.com/versions/" $(ccend)
	docker run --rm \
		--publish="4000:4000" \
	  --volume="${PWD}:/srv/jekyll" \
	  -it jekyll/builder:${JEKYLL_VERSION} \
	  jekyll serve