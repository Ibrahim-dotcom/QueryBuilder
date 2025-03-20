# views.py
from django.http import JsonResponse
from django.db import connection
from .models import Product, Category

def get_tables(request):
    # Return table names and their columns
    tables = {
        "Product": ["id", "name", "price", "category_id"],
        "Category": ["id", "name"]
    }
    return JsonResponse({"tables": tables})

def execute_query(request):
    import json
    data = json.loads(request.body)
    selected_fields = ", ".join(data.get("fields", []))
    table = data.get("table")
    filters = data.get("filters", [])
    
    # Build query
    query = f"SELECT {selected_fields} FROM {table}"
    if filters:
        conditions = " AND ".join([f"{f['field']} {f['operator']} '{f['value']}'" for f in filters])
        query += f" WHERE {conditions}"

    with connection.cursor() as cursor:
        cursor.execute(query)
        rows = cursor.fetchall()

    return JsonResponse({"query": query, "results": rows})
