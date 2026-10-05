import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/products/Products';
import ProductForm from './pages/products/ProductForm';
import ProductView from './pages/products/ProductView';
import Categories from './pages/products/Categories';
import Stock from './pages/stock/Stock';
import NewSale from './pages/sales/NewSale';
import SalesHistory from './pages/sales/SalesHistory';
import SaleView from './pages/sales/SaleView';
import EditSale from './pages/sales/EditSale';
import Receipts from './pages/sales/Receipts';
import NewPurchase from './pages/purchases/NewPurchase';
import PurchaseHistory from './pages/purchases/PurchaseHistory';
import PurchaseView from './pages/purchases/PurchaseView';
import Customers from './pages/customers/Customers';
import CustomerView from './pages/customers/CustomerView';
import CustomerDebts from './pages/customers/CustomerDebts';
import CustomerPayments from './pages/customers/CustomerPayments';
import Suppliers from './pages/suppliers/Suppliers';
import SupplierView from './pages/suppliers/SupplierView';
import Expenses from './pages/expenses/Expenses';
import Reports from './pages/reports/Reports';
import Users from './pages/users/Users';
import SettingsPage from './pages/settings/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={(
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        )}
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductView />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="categories" element={<Categories />} />
        <Route path="stock" element={<Stock />} />
        <Route path="sales/new" element={<NewSale />} />
        <Route path="sales" element={<SalesHistory />} />
        <Route path="sales/:id" element={<SaleView />} />
        <Route path="sales/:id/edit" element={<EditSale />} />
        <Route path="receipts" element={<Receipts />} />
        <Route path="purchases/new" element={<NewPurchase />} />
        <Route path="purchases" element={<PurchaseHistory />} />
        <Route path="purchases/:id" element={<PurchaseView />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/debts" element={<CustomerDebts />} />
        <Route path="customers/payments" element={<CustomerPayments />} />
        <Route path="customers/:id" element={<CustomerView />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="suppliers/:id" element={<SupplierView />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="reports" element={<Reports />} />
        <Route
          path="users"
          element={(
            <ProtectedRoute adminOnly>
              <Users />
            </ProtectedRoute>
          )}
        />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
