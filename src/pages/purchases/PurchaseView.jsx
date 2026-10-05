import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import { money, formatDateTime } from '../../utils/format';
import Badge from '../../components/Badge';

export default function PurchaseView() {
  const { id } = useParams();
  const [purchase, setPurchase] = useState(null);

  useEffect(() => {
    api.get(`/purchases/${id}`).then((res) => setPurchase(res.data.data.purchase));
  }, [id]);

  if (!purchase) return <Spinner />;

  return (
    <div className="card max-w-3xl">
      <h1 className="text-xl font-semibold">{purchase.invoiceNumber}</h1>
      <p className="text-sm text-slate-500">{formatDateTime(purchase.date)} · {purchase.supplier?.name}</p>
      <div className="my-3"><Badge status={purchase.paymentStatus}>{purchase.paymentStatus}</Badge></div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500"><th className="py-2">Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        </thead>
        <tbody>
          {purchase.items.map((i) => (
            <tr key={i._id} className="border-t border-slate-100 dark:border-slate-800">
              <td className="py-2">{i.productName}</td>
              <td>{i.quantity}</td>
              <td>{money(i.purchasePrice)}</td>
              <td>{money(i.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4">Total {money(purchase.total)} · Paid {money(purchase.paid)} · Remaining {money(purchase.remaining)}</p>
    </div>
  );
}
