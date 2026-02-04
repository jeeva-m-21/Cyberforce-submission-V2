.PHONY: init test lint format

init:
	python -m venv .venv
	. .venv/Scripts/activate && pip install -r requirements-dev.txt

test:
	. .venv/Scripts/activate && pytest -q

lint:
	. .venv/Scripts/activate && flake8 .

format:
	. .venv/Scripts/activate && black .
