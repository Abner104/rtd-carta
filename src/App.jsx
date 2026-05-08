// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MenuPage from "./app/public/MunePage";
import LoginPage from "./app/public/admin/LoginPage";
import AdminLayout from "./app/public/admin/AdminLayout";
import DashboardPage from "./app/public/admin/DashboardPage";
import CategoriesPage from "./app/public/admin/CategoriesPage";
import ProductsPage from "./app/public/admin/ProductsPage";
import SettingsPage from "./app/public/admin/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/admin/login" element={<LoginPage />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="productos" element={<ProductsPage />} />
          <Route path="configuracion" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}