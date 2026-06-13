# Gymster - Project Context Index

Tai lieu nay gom context hien tai cua du an Gymster de phuc vu cac folder bai tap trong anh: RequirementAnalysis, ArchitecturalDesign, DetailedDesign, UnitTest, GoodDesign va Tong hop ket qua BTL.

## Thong tin tong quan

- Ten du an: Gymster.
- Loai he thong: ung dung quan ly phong gym nhieu portal.
- Portal chinh: landing/auth, member, staff, PT/trainer, admin/owner.
- Frontend chinh: `frontend/`, React 19 + Vite 8 + React Router 7.
- Backend phu tro AI: `backend/`, Node.js HTTP server, Anthropic Claude API.
- Database: `database/`, PostgreSQL/Supabase SQL scripts.
- UI tham khao tu Figma: `source_figma/`, gom admin, staff, PT, hoi vien, login.
- Deployment da duoc ghi trong README: https://gymster-vert.vercel.app/

## Cac file context da tao

- `01_RequirementAnalysis_Context.md`: tac nhan, requirement, use case, user story, business rules, SRS notes.
- `02_ArchitecturalDesign_Context.md`: kien truc tong the, module, data flow, deployment, sequence context.
- `03_DetailedDesign_Context.md`: bang du lieu, class/domain model, API/service map, flow chi tiet.
- `04_Programming_Context.md`: cau truc code, convention, command, module chinh, rui ro khi coding.
- `05_UnitTest_Context.md`: test hien co, cach chay, test case de xuat theo tung module.
- `06_GoodDesign_Context.md`: context danh gia coupling/cohesion/SOLID va cac diem thiet ke tot.
- `07_Project_Summary_Context.md`: ban tong hop ngan de dua vao file tong hop BTL.

## Cau truc source can biet

```text
Gymster/
|-- frontend/
|   |-- src/
|   |   |-- routes/AppRoutes.jsx
|   |   |-- pages/
|   |   |-- roles/
|   |   |   |-- admin/
|   |   |   |-- member/
|   |   |   |-- pt/
|   |   |   `-- staff/
|   |   |-- roles/shared/
|   |   |-- services/
|   |   |-- styles/
|   |   `-- test_data/
|-- backend/
|   |-- server.js
|   `-- services/
|-- database/
|   |-- schema.sql
|   |-- seed.sql
|   `-- *_upgrade.sql
|-- source_figma/
|-- docs/
`-- README.md
```

## Mapping voi cac folder trong anh

| Folder trong anh | File context nen dung |
| --- | --- |
| `01 - RequirementAnalysis` | `01_RequirementAnalysis_Context.md` |
| `02 - ArchitecturalDesign` | `02_ArchitecturalDesign_Context.md` |
| `03 - DetailedDesign` | `03_DetailedDesign_Context.md` |
| `04 - Programming` | `04_Programming_Context.md` |
| `05 - UnitTest` | `05_UnitTest_Context.md` |
| `06 - GoodDesign` | `06_GoodDesign_Context.md` |
| `07 - Tong hop ket qua BTL` | `07_Project_Summary_Context.md` |

## Ghi chu hien trang

- README hien tai co mot so doan tieng Viet bi loi encoding mojibake, nhung noi dung du an van ro rang.
- App dang trong giai doan migrate tu mock/localStorage sang Supabase.
- Mot so service co fallback local khi thieu Supabase env.
- Text UI tron lan tieng Anh va tieng Viet; tai lieu nay viet bang tieng Viet sach de dung cho bao cao.
