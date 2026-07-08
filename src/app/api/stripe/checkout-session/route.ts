import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import {
  isDonationFrequency,
  toDonationAmountInPence,
} from '@/lib/donations'

export const runtime = 'nodejs'

type DonationPaymentMethodType = Extract<
  Stripe.Checkout.SessionCreateParams.PaymentMethodType,
  'card' | 'link' | 'paypal'
>

const DONATION_PRODUCT_NAME = 'Donation to Al Judi Masjid'
const DONATION_PRODUCT_DESCRIPTION = 'Supporting Al Judi Masjid'
const supportedDonationPaymentMethodTypes = new Set<DonationPaymentMethodType>([
  'card',
  'link',
  'paypal',
] satisfies DonationPaymentMethodType[])
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

function getBaseUrl(request: NextRequest) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '')
  }

  const origin = request.headers.get('origin')

  if (origin) {
    return origin
  }

  return new URL(request.url).origin
}

function getCheckoutErrorMessage(error: unknown) {
  if (error instanceof Stripe.errors.StripeError) {
    return error.message
  }

  return 'Unable to start Stripe Checkout. Please try again.'
}

function isDonationPaymentMethodType(type: string): type is DonationPaymentMethodType {
  return supportedDonationPaymentMethodTypes.has(type as DonationPaymentMethodType)
}

function getConfiguredPaymentMethodTypes() {
  const configuredTypes = process.env.STRIPE_DONATION_PAYMENT_METHOD_TYPES?.trim()

  if (!configuredTypes) {
    return null
  }

  const paymentMethodTypes = configuredTypes
    .split(',')
    .map(type => type.trim().toLowerCase())
    .filter(isDonationPaymentMethodType)

  return paymentMethodTypes.length > 0
    ? Array.from(new Set(paymentMethodTypes))
    : null
}

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      {
        error:
          'Stripe is not configured yet. Add STRIPE_SECRET_KEY to the environment.',
      },
      { status: 500 }
    )
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid donation request.' },
      { status: 400 }
    )
  }

  const requestBody =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : {}
  const amountInPence = toDonationAmountInPence(requestBody.amount)
  const frequency = isDonationFrequency(requestBody.frequency)
    ? requestBody.frequency
    : 'once'

  if (!amountInPence) {
    return NextResponse.json(
      { error: 'Choose a donation amount between GBP 1 and GBP 100,000.' },
      { status: 400 }
    )
  }

  const baseUrl = getBaseUrl(request)
  const metadata = {
    frequency,
    productName: DONATION_PRODUCT_NAME,
  }
  const mode = frequency === 'monthly' ? 'subscription' : 'payment'
  const paymentMethodTypes = getConfiguredPaymentMethodTypes()
  const paymentMethodConfiguration =
    process.env.STRIPE_DONATION_PAYMENT_METHOD_CONFIGURATION?.trim()

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode,
    success_url: `${baseUrl}/?donation=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/?donation=cancelled#donate`,
    billing_address_collection: 'auto',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'gbp',
          unit_amount: amountInPence,
          product_data: {
            name: DONATION_PRODUCT_NAME,
            description: DONATION_PRODUCT_DESCRIPTION,
            metadata,
          },
          ...(frequency === 'monthly'
            ? { recurring: { interval: 'month' as const } }
            : {}),
        },
      },
    ],
    metadata,
    payment_method_options: {
      paypal: {
        preferred_locale: 'en-GB',
      },
    },
    custom_text: {
      submit: {
        message:
          'JazakAllahu khairan for supporting Al Judi Masjid.',
      },
    },
    ...(frequency === 'once'
      ? {
          payment_intent_data: {
            metadata,
          },
          submit_type: 'donate' as const,
        }
      : {
          subscription_data: {
            metadata,
          },
    }),
    ...(paymentMethodTypes ? { payment_method_types: paymentMethodTypes } : {}),
    ...(paymentMethodConfiguration
      ? { payment_method_configuration: paymentMethodConfiguration }
      : {}),
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams)

    if (!session.url) {
      return NextResponse.json(
        { error: 'Stripe did not return a Checkout URL.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('[stripe] Failed to create donation checkout session:', error)

    return NextResponse.json(
      { error: getCheckoutErrorMessage(error) },
      { status: 500 }
    )
  }
}
