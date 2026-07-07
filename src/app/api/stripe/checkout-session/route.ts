import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import {
  getDonationFund,
  isDonationFrequency,
  toDonationAmountInPence,
} from '@/lib/donations'

export const runtime = 'nodejs'

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
  const fund = getDonationFund(requestBody.fund)

  if (!amountInPence) {
    return NextResponse.json(
      { error: 'Choose a donation amount between GBP 1 and GBP 100,000.' },
      { status: 400 }
    )
  }

  if (!fund) {
    return NextResponse.json(
      { error: 'Choose a valid donation purpose.' },
      { status: 400 }
    )
  }

  const baseUrl = getBaseUrl(request)
  const metadata = {
    donationFund: fund.id,
    donationFundLabel: fund.label,
    frequency,
  }
  const mode = frequency === 'monthly' ? 'subscription' : 'payment'
  const paymentMethodConfiguration =
    process.env.STRIPE_DONATION_PAYMENT_METHOD_CONFIGURATION?.trim()

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode,
    success_url: `${baseUrl}/?donation=success&session_id={CHECKOUT_SESSION_ID}#donate`,
    cancel_url: `${baseUrl}/?donation=cancelled#donate`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'gbp',
          unit_amount: amountInPence,
          product_data: {
            name: `${fund.label} - Al Judi Masjid`,
            description: fund.description,
            metadata,
          },
          ...(frequency === 'monthly'
            ? { recurring: { interval: 'month' as const } }
            : {}),
        },
      },
    ],
    metadata,
    custom_text: {
      submit: {
        message:
          'JazakAllahu khairan for supporting Al Judi Masjid. Stripe will email your payment confirmation.',
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
