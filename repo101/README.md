# Business Workflow & ERP System  

A full-stack **ERP-style business workflow application** built with modern web technologies.  
This system manages **invoices, payments, suppliers, employees, purchases, and inventory** with **real-time synchronization** and **analytics dashboards**.  

---

## 🚀 Features  

- **Invoicing & Payments**
  - Multi-currency support with real-time exchange rates  
  - International tax handling (GST, VAT, IGST)  
  - PDF invoice & purchase order generation with company branding  
  - Partial and full payment tracking  

- **Client & Supplier Management**
  - CRUD operations with validations  
  - Contact details, tax info, and status tracking  
  - Real-time metrics on revenue, outstanding amounts, and purchases  

- **Purchases & Inventory**
  - End-to-end purchase workflow (request → approval → PO → stock update)  
  - Real-time stock tracking with low-stock alerts  
  - Priority-based purchase requests with admin approvals  

- **Analytics & Reporting**
  - Revenue trends, overdue invoices, client performance  
  - Aging reports with collection risk monitoring  
  - Interactive charts for financial insights  

- **Security & Access**
  - Role-based access control (Admin, Employee)  
  - Firebase authentication with secure CRUD operations  

---

## 🛠 Tech Stack  

- **Frontend:** React, TypeScript, Vite, shadcn-ui, Tailwind CSS  
- **Backend:** Node.js, Express  
- **Database & Auth:** Firebase, Firestore  
- **Other:** PDF generation, Currency API integration  

---

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```




