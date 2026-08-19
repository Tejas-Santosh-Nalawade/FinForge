import io
from typing import Any, Dict, List

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from .database import supabase

app = FastAPI(
    title="Supabase File Processing System",
    description="Handles PDF uploads and Excel/CSV import into Supabase.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    return {"status": "ok", "service": "finforge-backend"}


@app.post("/upload-pdfs/", status_code=status.HTTP_201_CREATED)
async def upload_multiple_pdfs(files: List[UploadFile] = File(...)) -> Dict[str, Any]:
    if len(files) > 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch limit exceeded. You can only upload up to 15 PDFs at once.",
        )

    uploaded_records: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []

    for file in files:
        filename = file.filename or ""
        if not filename.lower().endswith(".pdf"):
            errors.append({"file": filename, "error": "Invalid format. Only PDFs allowed."})
            continue

        try:
            file_bytes = await file.read()
            storage_path = f"documents/{filename}"

            supabase.storage.from_("pdf-uploads").upload(
                path=storage_path,
                file=file_bytes,
                file_options={"content-type": "application/pdf", "upsert": "true"},
            )

            public_url = supabase.storage.from_("pdf-uploads").get_public_url(storage_path)
            uploaded_records.append(
                {"filename": filename, "storage_path": storage_path, "url": public_url}
            )
        except Exception as exc:
            errors.append({"file": filename, "error": str(exc)})
        finally:
            await file.close()

    return {
        "success": True,
        "total_uploaded": len(uploaded_records),
        "uploaded_files": uploaded_records,
        "failed_files": errors,
    }


@app.post("/upload-data-sheets/", status_code=status.HTTP_201_CREATED)
async def upload_and_convert_data_sheets(files: List[UploadFile] = File(...)) -> Dict[str, Any]:
    if len(files) > 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch limit exceeded. You can only upload up to 15 sheets at once.",
        )

    processed_tables: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []

    for file in files:
        filename = file.filename or ""
        lower_name = filename.lower()

        if not (lower_name.endswith(".xlsx") or lower_name.endswith(".xls") or lower_name.endswith(".csv")):
            errors.append(
                {"file": filename, "error": "Invalid format. Only Excel (.xlsx/.xls) or CSV files allowed."}
            )
            continue

        try:
            file_bytes = await file.read()

            df: pd.DataFrame
            if lower_name.endswith(".csv"):
                df = pd.read_csv(io.BytesIO(file_bytes))
            else:
                excel_buffer: Any = io.BytesIO(file_bytes)
                df = pd.read_excel(excel_buffer, engine="openpyxl")

            if df.empty:
                errors.append({"file": filename, "error": "Sheet structural body empty. No rows detected."})
                continue

            df = df.where(df.notna(), None)
            data_to_insert: List[Dict[str, Any]] = [
                {str(key): value for key, value in row.items()} for row in df.to_dict(orient="records")
            ]

            target_table_name = "FinForge"
            chunk_size = 1000
            for start in range(0, len(data_to_insert), chunk_size):
                chunk = data_to_insert[start : start + chunk_size]
                supabase.table(target_table_name).insert(chunk).execute()

            processed_tables.append(
                {
                    "filename": filename,
                    "rows_written_to_sql": len(data_to_insert),
                    "destination_table": target_table_name,
                }
            )
        except Exception as exc:
            errors.append({"file": filename, "error": str(exc)})
        finally:
            await file.close()

    return {
        "success": True,
        "total_sheets_processed": len(processed_tables),
        "processed_sheets": processed_tables,
        "failed_sheets": errors,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
