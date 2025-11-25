from fastapi import APIRouter, HTTPException
from src.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from src.services.category_service import CategoryService
from typing import List
from beanie import PydanticObjectId
from src.schemas.subcategory import SubCategoryResponse
from src.utils.security import get_current_user
from fastapi import APIRouter, Depends


router = APIRouter(prefix="/categories", tags=["Categories"], dependencies=[Depends(get_current_user)] )

@router.post("/", response_model=CategoryResponse)
async def create_category(category: CategoryCreate):
    print(f"POST /categories - Creating category: {category.name}")
    result = await CategoryService.create_category(category)
    print(f"POST /categories - Created category with ID: {result.id}")
    return result

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: str):
    print(f"GET /categories/{category_id} - Fetching category: {category_id}")
    category = await CategoryService.get_category(category_id)
    if not category:
        print(f"GET /categories/{category_id} - Category not found")
        raise HTTPException(status_code=404, detail="Category not found")
    print(f"GET /categories/{category_id} - Found category: {category.name}")
    return category

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, category: CategoryUpdate):
    print(f"PUT /categories/{category_id} - Updating category: {category_id} with data: {category.model_dump(exclude_unset=True)}")
    updated = await CategoryService.update_category(category_id, category)
    if not updated:
        print(f"PUT /categories/{category_id} - Category not found")
        raise HTTPException(status_code=404, detail="Category not found")
    print(f"PUT /categories/{category_id} - Successfully updated category: {updated.name}")
    return updated

@router.delete("/{category_id}")
async def delete_category(category_id: str):
    await CategoryService.delete_category(category_id)
    return {"status": "deleted"}

@router.get("/", response_model=List[CategoryResponse])
async def get_all_categories():
    print("GET /categories - Fetching all categories")
    categories = await CategoryService.get_all_categories()
    print(f"GET /categories - Returning {len(categories)} categories")
    return categories

@router.get("/{category_id}/subcategories", response_model=List[SubCategoryResponse])
async def get_subcategories_by_category(category_id: str):
    print(f"GET /categories/{category_id}/subcategories - Fetching subcategories for category: {category_id}")
    subcategories = await CategoryService.get_subcategories_by_category(category_id)
    print(f"GET /categories/{category_id}/subcategories - Returning {len(subcategories)} subcategories")
    for sub in subcategories:
        print(f"  - Subcategory: {sub.name} (ID: {sub.id})")
    return subcategories

