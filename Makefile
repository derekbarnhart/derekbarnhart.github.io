.PHONY: serve help

PORT ?= 8000
HOST ?= 127.0.0.1

serve:
	@echo "Serving static files from $(CURDIR)"
	@echo "URL: http://$(HOST):$(PORT)"
	python3 -m http.server $(PORT) --bind $(HOST)

help:
	@echo "Available targets:"
	@echo "  serve  - Serve static files on http://$(HOST):$(PORT) (override with PORT/HOST)"
