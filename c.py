from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent 
SKIP_DIRS = ["node_modules", ".git", "__pycache__"]  # add any dirs you want to skip

def list_files_tool():
    """Return a list of all files with relative paths, skipping specified directories."""
    files = []
    for path in BASE_DIR.rglob("*"):
        if path.is_file() and not any(skip in path.parts for skip in SKIP_DIRS):
            files.append(str(path.relative_to(BASE_DIR)))

    if not files:
        return "📂 No files found in the project directory."
    
    file_list = "\n".join(files)
    return f"📁 Files in project directory (excluding {', '.join(SKIP_DIRS)}):\n\n{file_list}"
k=list_files_tool()
print(k)