"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, ExternalLink, Key, Info } from "lucide-react";
import { toast } from "sonner";

export default function APIDocumentationPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const [openApiSpec, setOpenApiSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load OpenAPI spec
    fetch("/api/v1/openapi")
      .then((response) => response.json())
      .then((spec) => {
        setOpenApiSpec(spec);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load API spec:", error);
        setLoading(false);
      });
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const exampleRequests = {
    createOrder: `curl -X POST "/api/v1/orders" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-MES-Team-ID: ${teamId}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "productIdentifier": "PART-123",
    "quantity": 100,
    "routingName": "Standard Assembly",
    "priority": 2,
    "notes": "Rush order for customer ABC"
  }'`,

    listOrders: `curl -X GET "/api/v1/orders?status=in_progress&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-MES-Team-ID: ${teamId}"`,

    startOperation: `curl -X PATCH "/api/v1/work-order-operations/WOO_ID" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-MES-Team-ID: ${teamId}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "start",
    "operatorId": "OPERATOR_ID"
  }'`,
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Loading API documentation...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
        <p className="text-muted-foreground">
          Integrate your systems with the MES External API. Create orders,
          monitor operations, collect data, and access analytics
          programmatically.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="reference">API Reference</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                API Overview
              </CardTitle>
              <CardDescription>
                The MES External API provides programmatic access to all core
                manufacturing operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Base URL</h4>
                  <code className="block p-2 bg-muted rounded text-sm">
                    /api/v1
                  </code>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">API Version</h4>
                  <Badge variant="outline">v1.0.0</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Supported Operations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-medium">Orders</h5>
                    <p className="text-sm text-muted-foreground">
                      Create and manage manufacturing orders
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-medium">Work Order Operations</h5>
                    <p className="text-sm text-muted-foreground">
                      Track and control operation execution
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-medium">Routings</h5>
                    <p className="text-sm text-muted-foreground">
                      Access manufacturing process definitions
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-medium">Analytics</h5>
                    <p className="text-sm text-muted-foreground">
                      Performance metrics and KPIs
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-medium">Data Collection</h5>
                    <p className="text-sm text-muted-foreground">
                      Submit quality and process data
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-medium">Files</h5>
                    <p className="text-sm text-muted-foreground">
                      Upload and download attachments
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  All API endpoints require authentication with an API key and
                  team ID header. Rate limiting is enforced at 1,000 requests
                  per hour with burst support for 100 requests per minute.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentication
              </CardTitle>
              <CardDescription>
                The API uses API key authentication with team scoping for secure
                access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Required Headers</h4>
                <div className="space-y-3">
                  <div>
                    <code className="text-sm bg-muted p-2 rounded block">
                      Authorization: Bearer YOUR_API_KEY
                    </code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your generated API key
                    </p>
                  </div>
                  <div>
                    <code className="text-sm bg-muted p-2 rounded block">
                      X-MES-Team-ID: {teamId}
                    </code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your team ID (current team shown)
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">API Key Permissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 border rounded-lg">
                    <Badge variant="outline" className="mb-2">
                      Read
                    </Badge>
                    <p className="text-sm">GET requests to view data</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <Badge variant="outline" className="mb-2">
                      Write
                    </Badge>
                    <p className="text-sm">
                      POST, PUT, PATCH requests to modify data
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <Badge variant="outline" className="mb-2">
                      Admin
                    </Badge>
                    <p className="text-sm">
                      DELETE requests and admin operations
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Rate Limiting</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <ul className="space-y-1 text-sm">
                    <li>
                      • <strong>1,000 requests per hour</strong> - Overall limit
                    </li>
                    <li>
                      • <strong>100 requests per minute</strong> - Burst limit
                    </li>
                    <li>• Rate limit headers included in all responses</li>
                    <li>• 429 status code when limits exceeded</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Managing API Keys</h4>
                <p className="text-sm text-muted-foreground">
                  API keys can be created and managed in the Configuration
                  section of your dashboard.
                </p>
                <Button asChild>
                  <a href={`/dashboard/${teamId}/configuration`}>
                    <Key className="mr-2 h-4 w-4" />
                    Manage API Keys
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Order</CardTitle>
                <CardDescription>
                  Create a new manufacturing order with routing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Request</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(exampleRequests.createOrder)
                      }
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                    <code>{exampleRequests.createOrder}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>List Orders</CardTitle>
                <CardDescription>
                  Retrieve orders with filtering and pagination
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Request</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(exampleRequests.listOrders)
                      }
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                    <code>{exampleRequests.listOrders}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Start Operation</CardTitle>
                <CardDescription>
                  Begin execution of a work order operation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Request</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(exampleRequests.startOperation)
                      }
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                    <code>{exampleRequests.startOperation}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reference" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Reference</CardTitle>
              <CardDescription>
                Complete OpenAPI specification with all available endpoints,
                schemas, and examples.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button asChild>
                  <a
                    href="/api/v1/openapi"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View OpenAPI Spec
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href={`https://petstore.swagger.io/?url=${window.location.origin}/api/v1/openapi`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in Swagger UI
                  </a>
                </Button>
              </div>

              {openApiSpec && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Available Endpoints</h4>
                  <div className="grid gap-3">
                    {Object.entries(openApiSpec.paths || {}).map(
                      ([path, methods]: [string, any]) => (
                        <div key={path} className="border rounded-lg p-3">
                          <h5 className="font-medium mb-2">{path}</h5>
                          <div className="flex flex-wrap gap-2">
                            {Object.keys(methods).map((method) => (
                              <Badge
                                key={method}
                                variant={
                                  method === "get"
                                    ? "default"
                                    : method === "post"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {method.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
