# views.py
from django.http import JsonResponse
from django.db import connection
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
from .models import SavedQuery



def get_database_info(request):
    # Fetch all tables in the database
    with connection.cursor() as cursor:
        cursor.execute("SHOW TABLES")
        tables = [row[0] for row in cursor.fetchall()]

    # Fetch columns for each table
    database_info = {}
    for table in tables:
        with connection.cursor() as cursor:
            cursor.execute(f"DESCRIBE {table}")
            columns = [row[0] for row in cursor.fetchall()]
        database_info[table] = columns

    return JsonResponse({"database_info": database_info})

@csrf_exempt
def execute_custom_query(request):
    import json
    data = json.loads(request.body)
    query = data.get("query")

    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description]

        return JsonResponse({"columns": columns, "rows": rows})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


def get_tables(request):
    """Fetch all tables in the database."""
    query = "SHOW TABLES;"
    with connection.cursor() as cursor:
        cursor.execute(query)
        tables = [row[0] for row in cursor.fetchall()]
    return JsonResponse({"tables": tables})

def get_table_columns(request, table_name):
    """Fetch columns for a specific table."""
    query = f"DESCRIBE {table_name};"
    with connection.cursor() as cursor:
        cursor.execute(query)
        columns = [row[0] for row in cursor.fetchall()]
    return JsonResponse({"columns": columns})


@csrf_exempt
def save_query(request):
    if request.method == "POST":
        data = json.loads(request.body)
        name = data.get("name")
        query = data.get("query")

        if not name or not query:
            return JsonResponse({"error": "Name and query are required"}, status=400)

        saved_query, created = SavedQuery.objects.update_or_create(
            name=name, defaults={"query": query}
        )
        return JsonResponse({"success": True, "created": created})

def fetch_queries(request):
    queries = SavedQuery.objects.all().values("id", "name", "query", "created_at")
    return JsonResponse(list(queries), safe=False)