import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/config/backend";

const BACKEND = BACKEND_URL;

export async function GET(req, { params }) {
  const resolvedParams = await params;
  return proxyRequest(req, resolvedParams);
}

export async function POST(req, { params }) {
  const resolvedParams = await params;
  return proxyRequest(req, resolvedParams);
}

export async function PUT(req, { params }) {
  const resolvedParams = await params;
  return proxyRequest(req, resolvedParams);
}

export async function DELETE(req, { params }) {
  const resolvedParams = await params;
  return proxyRequest(req, resolvedParams);
}

export async function PATCH(req, { params }) {
  const resolvedParams = await params;
  return proxyRequest(req, resolvedParams);
}

async function proxyRequest(req, params) {
  const path = params.path.join("/");

  // Get query parameters from the request URL
  const { searchParams } = new URL(req.url);
  const queryString = searchParams.toString();

  // Construct backend URL with query parameters
  const backendUrl = queryString
    ? `${BACKEND}/${path}?${queryString}`
    : `${BACKEND}/${path}`;

  // Clone headers and remove problematic ones
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("accept-encoding"); // Important: let Next.js handle encoding

  let body = null;
  let fetchHeaders = headers;

  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      const contentType = req.headers.get("content-type");

      // Handle FormData (multipart/form-data) - pass through as FormData
      if (contentType && contentType.includes("multipart/form-data")) {
        // For FormData, we need to pass the original FormData
        // Remove content-type header to let fetch set it with boundary
        fetchHeaders = new Headers(headers);
        fetchHeaders.delete("content-type");

        // Get the FormData from the request
        body = await req.formData();
      } else {
        // Handle JSON or text
        body = await req.text();
      }
    } catch (e) {
      console.error("Error reading request body:", e);
    }
  }

  try {
    const backendRes = await fetch(backendUrl, {
      method: req.method,
      headers: fetchHeaders,
      body,
      credentials: "include",
    });

    // Read the response as text/json
    const contentType = backendRes.headers.get("content-type");
    let responseData;

    if (contentType && contentType.includes("application/json")) {
      responseData = await backendRes.json();
    } else {
      responseData = await backendRes.text();
    }

    // Create response with proper headers
    const responseHeaders = new Headers();

    // Copy important headers
    backendRes.headers.forEach((value, key) => {
      if (
        key !== "content-encoding" &&
        key !== "content-length" &&
        key !== "transfer-encoding"
      ) {
        responseHeaders.set(key, value);
      }
    });

    // Handle set-cookie headers specially
    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) {
      responseHeaders.set("set-cookie", setCookie);
    }

    // Return appropriate response
    if (typeof responseData === "object") {
      return NextResponse.json(responseData, {
        status: backendRes.status,
        headers: responseHeaders,
      });
    } else {
      return new NextResponse(responseData, {
        status: backendRes.status,
        headers: responseHeaders,
      });
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Proxy request failed", detail: error.message },
      { status: 500 }
    );
  }
}
