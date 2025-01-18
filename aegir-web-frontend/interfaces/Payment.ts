interface Payment {
  id: number;
  payment_id: string;
  currency: string;
  rate: number;
  payment_date: string;
  package: number;
}

export default Payment;
