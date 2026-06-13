import { Injectable } from '@angular/core';

import { Charges } from '../models/order.models';

@Injectable({
  providedIn: 'root',
})
export class BrokerageCalculator {
  calculateOptionCharges(buyPrice: number, sellPrice: number, qty: number): Charges {
    const buyValue = buyPrice * qty;
    const sellValue = sellPrice * qty;
    const turnover = buyValue + sellValue;

    /**
     * Brokerage
     * ₹20 per order
     */
    const brokerageBuy = 20;
    const brokerageSell = 20;

    const brokerage = brokerageBuy + brokerageSell;

    /**
     * Transaction Charges
     * NSE Options
     * 0.03503% premium
     */
    const transactionCharges = turnover * 0.0003503;

    /**
     * STT
     * 0.15% sell premium
     */
    const stt = sellValue * 0.0015;

    /**
     * SEBI
     * ₹10 crore
     */
    const sebiCharges = turnover * 0.000001;

    /**
     * Stamp Duty
     * buy side
     * 0.003%
     */
    const stampDuty = buyValue * 0.00003;

    /**
     * GST
     */
    const gst = (brokerage + transactionCharges + sebiCharges) * 0.18;

    const totalCharges = brokerage + transactionCharges + stt + sebiCharges + stampDuty + gst;

    return {
      brokerage,
      brokerageCharges: brokerage,
      transactionCharges,
      gst,
      stt,
      sebiCharges,
      stampDuty,
      totalCharges,
    };
  }
}
