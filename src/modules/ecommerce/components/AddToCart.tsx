'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'

import { shopRoutes } from '../config'
import { formatCents } from '../utilities/formatPrice'

export type VariantChoice = {
  id: string
  title: string
  priceCents: number | null
  inventory: number | null
}

type Props = {
  productID: string
  priceCents: number | null
  inventory: number | null
  variants?: VariantChoice[]
}

const isSoldOut = (inventory: number | null) => inventory === 0

export const AddToCart: React.FC<Props> = ({ inventory, priceCents, productID, variants }) => {
  const { addItem, isLoading } = useCart()
  const router = useRouter()
  const hasVariants = Boolean(variants && variants.length > 0)
  const [variantID, setVariantID] = useState<string | undefined>(
    () => variants?.find((v) => !isSoldOut(v.inventory) && v.priceCents !== null)?.id,
  )
  const [quantity, setQuantity] = useState(1)
  const [status, setStatus] = useState<'idle' | 'added' | 'error'>('idle')

  const selected = useMemo(() => variants?.find((v) => v.id === variantID), [variants, variantID])
  const price = hasVariants ? (selected?.priceCents ?? null) : priceCents
  const stock = hasVariants ? (selected?.inventory ?? null) : inventory
  const canBuy = price !== null && !isSoldOut(stock) && (!hasVariants || Boolean(selected))
  const maxQuantity = typeof stock === 'number' ? stock : 99

  const onAdd = async () => {
    setStatus('idle')
    try {
      await addItem({ product: productID, ...(selected ? { variant: selected.id } : {}) }, quantity)
      setStatus('added')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-2xl font-medium tabular-nums">
        {price !== null ? formatCents(price) : 'Prijs niet beschikbaar'}
        {price !== null && <span className="ml-2 text-sm text-muted-foreground">incl. btw</span>}
      </p>

      {hasVariants && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-medium">Kies een variant</legend>
          {variants!.map((variant) => {
            const disabled = isSoldOut(variant.inventory) || variant.priceCents === null
            return (
              <label
                className="flex cursor-pointer items-center gap-3 rounded-[var(--radius)] border border-border px-3 py-2 has-[:checked]:border-primary has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
                key={variant.id}
              >
                <input
                  checked={variantID === variant.id}
                  disabled={disabled}
                  name="variant"
                  onChange={() => setVariantID(variant.id)}
                  type="radio"
                  value={variant.id}
                />
                <span className="flex-1">{variant.title}</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {isSoldOut(variant.inventory) ? 'Uitverkocht' : formatCents(variant.priceCents)}
                </span>
              </label>
            )
          })}
        </fieldset>
      )}

      {isSoldOut(stock) && !hasVariants && <p className="text-destructive">Uitverkocht</p>}

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Aantal
          <input
            className="h-10 w-20 rounded-md border border-input bg-background px-3"
            max={maxQuantity}
            min={1}
            onChange={(e) =>
              setQuantity(Math.max(1, Math.min(maxQuantity, Number(e.target.value) || 1)))
            }
            type="number"
            value={quantity}
          />
        </label>
        <Button disabled={!canBuy || isLoading} onClick={onAdd} size="lg" type="button">
          {isLoading ? 'Even geduld…' : 'In winkelmand'}
        </Button>
      </div>

      <div aria-live="polite" className="min-h-6 text-sm">
        {status === 'added' && (
          <span>
            Toegevoegd aan je winkelmand.{' '}
            <button
              className="underline"
              onClick={() => router.push(shopRoutes.cart)}
              type="button"
            >
              Bekijk winkelmand
            </button>
          </span>
        )}
        {status === 'error' && (
          <span className="text-destructive">
            Toevoegen lukte niet. Mogelijk is er onvoldoende voorraad.
          </span>
        )}
      </div>
    </div>
  )
}
