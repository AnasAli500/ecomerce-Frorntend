import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Spinner from './components/Spinner';

// ── Eagerly loaded (always needed immediately on auth) ──────────────────────
import Login from './pages/Login';

// ── Route-level lazy imports (code-split per route) ──────────────────────────
const Dashboard        = lazy(() => import('./pages/Dashboard'));
const Products         = lazy(() => import('./pages/products/Products'));
const ProductForm      = lazy(() => import('./pages/products/ProductForm'));
const ProductView      = lazy(() => import('./pages/products/ProductView'));
const Categories       = lazy(() => import('./pages/products/Categories'));
const Stock            = lazy(() => import('./pages/stock/Stock'));
const NewSale          = lazy(() => import('./pages/sales/NewSale'));
const SalesHistory     = lazy(() => import('./pages/sales/SalesHistory'));
const SaleView         = lazy(() => import('./pages/sales/SaleView'));
const EditSale         = lazy(() => import('./pages/sales/EditSale'));
const Receipts         = lazy(() => import('./pages/sales/Receipts'));
const NewPurchase      = lazy(() => import('./pages/purchases/NewPurchase'));
const PurchaseHistory  = lazy(() => import('./pages/purchases/PurchaseHistory'));
const PurchaseView     = lazy(() => import('./pages/purchases/PurchaseView'));
const Customers        = lazy(() => import('./pages/customers/Customers'));
const CustomerView     = lazy(() => import('./pages/customers/CustomerView'));
const CustomerDebts    = lazy(() => import('./pages/customers/CustomerDebts'));
const CustomerPayments = lazy(() => import('./pages/customers/CustomerPayments'));
const Suppliers        = lazy(() => import('./pages/suppliers/Suppliers'));
const SupplierView     = lazy(() => import('./pages/suppliers/SupplierView'));
const Expenses         = lazy(() => import('./pages/expenses/Expenses'));
const Reports          = lazy(() => import('./pages/reports/Reports'));
const ProfitReport     = lazy(() => import('./pages/reports/ProfitReport'));
const Users            = lazy(() => import('./pages/users/Users'));
const SettingsPage     = lazy(() => import('./pages/settings/SettingsPage'));
const AiAssistant      = lazy(() => import('./pages/ai/AiAssistant'));

// Shared fallback shown while any lazy page is loading
function PageFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner />
    </div>
  );
}

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
        <Route
          index
          element={(
            <Suspense fallback={<PageFallback />}>
              <Dashboard />
            </Suspense>
          )}
        />
        <Route
          path="ai-assistant"
          element={(
            <Suspense fallback={<PageFallback />}>
              <AiAssistant />
            </Suspense>
          )}
        />
        <Route
          path="products"
          element={(
            <Suspense fallback={<PageFallback />}>
              <Products />
            </Suspense>
          )}
        />
        <Route
          path="products/new"
          element={(
            <Suspense fallback={<PageFallback />}>
              <ProductForm />
            </Suspense>
          )}
        />
        <Route
          path="products/:id"
          element={(
            <Suspense fallback={<PageFallback />}>
              <ProductView />
            </Suspense>
          )}
        />
        <Route
          path="products/:id/edit"
          element={(
            <Suspense fallback={<PageFallback />}>
              <ProductForm />
            </Suspense>
          )}
        />
        <Route
          path="categories"
          element={(
            <Suspense fallback={<PageFallback />}>
              <Categories />
            </Suspense>
          )}
        />
        <Route
          path="stock"
          element={(
            <Suspense fallback={<PageFallback />}>
              <Stock />
            </Suspense>
          )}
        />
        <Route
          path="sales/new"
          element={(
            <Suspense fallback={<PageFallback />}>
              <NewSale />
            </Suspense>
          )}
        />
        <Route
          path="sales"
          element={(
            <Suspense fallback={<PageFallback />}>
              <SalesHistory />
            </Suspense>
          )}
        />
        <Route
          path="sales/:id"
          element={(
            <Suspense fallback={<PageFallback />}>
              <SaleView />
            </Suspense>
          )}
        />
        <Route
          path="sales/:id/edit"
          element={(
            <Suspense fallback={<PageFallback />}>
              <EditSale />
            </Suspense>
          )}
        />
        <Route
          path="receipts"
          element={(
            <Suspense fallback={<PageFallback />}>
              <Receipts />
            </Suspense>
          )}
        />
        <Route
          path="purchases/new"
          element={(
            <Suspense fallback={<PageFallback />}>
              <NewPurchase />
            </Suspense>
          )}
        />
        <Route
          path="purchases"
          element={(
            <Suspense fallback={<PageFallback />}>
              <PurchaseHistory />
            </Suspense>
          )}
        />
        <Route
          path="purchases/:id"
          element={(
            <Suspense fallback={<PageFallback />}>
              <PurchaseView />
            </Suspense>
          )}
        />
        <Route
          path="customers"
          element={(
            <Suspense fallback={<PageFallback />}>
              <Customers />
            </Suspense>
          )}
        />
        <Route
          path="customers/debts"
          element={(
            <Suspense fallback={<PageFallback />}>
              <CustomerDebts />
            </Suspense>
          )}
        />
        <Route
          path="customers/payments"
          element={(
            <Suspense fallback={<PageFallback />}>
              <CustomerPayments />
            </Suspense>
          )}
        />
        <Route
          path="customers/:id"
          element={(
            <Suspense fallback={<PageFallback />}>
              <CustomerView />
            </Suspense>
          )}
        />
        <Route
          path="suppliers"
          element={(
            <Suspense fallback={<PageFallback />}>
              <Suppliers />
            </Suspense>
          )}
        />
        <Route
          path="suppliers/:id"
          element={(
            <Suspense fallback={<PageFallback />}>
              <SupplierView />
            </Suspense>
          )}
        />
        <Route
          path="expenses"
          element={(
            <Suspense fallback={<PageFallback />}>
              <Expenses />
            </Suspense>
          )}
        />
        <Route
          path="reports"
          element={(
            <Suspense fallback={<PageFallback />}>
              <Reports />
            </Suspense>
          )}
        />
        <Route
          path="reports/profit"
          element={(
            <ProtectedRoute adminOnly>
              <Suspense fallback={<PageFallback />}>
                <ProfitReport />
              </Suspense>
            </ProtectedRoute>
          )}
        />
        <Route
          path="users"
          element={(
            <ProtectedRoute adminOnly>
              <Suspense fallback={<PageFallback />}>
                <Users />
              </Suspense>
            </ProtectedRoute>
          )}
        />
        <Route
          path="settings"
          element={(
            <Suspense fallback={<PageFallback />}>
              <SettingsPage />
            </Suspense>
          )}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
