import React from 'react'

import { CartView } from '../components/CartView'

export function CartPage() {
  return (
    <div className="container pt-16 pb-24">
      <h1 className="font-heading mb-8 text-4xl">Winkelmand</h1>
      <CartView />
    </div>
  )
}
