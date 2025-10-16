import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
    Calendar, 
    Loader, 
    Database,
    PlayCircle,
    PauseCircle,
    KeyRound,
    FileText,
    AlertCircle,
    Check,
    ExternalLink
} from 'lucide-react';
import { createConnector } from '../DatabaseConnector.js';

// --- Configuration ---
const TARGET_DATE = "2024-10-11"; 
const COMPANIES_HOUSE_API_BASE = 'https://api.company-information.service.gov.uk';

export default function LiveDataPage() {
    // API and Agent State
    const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('ch_api_key') || '');
    const [isAgentRunning, setIsAgentRunning] = useState(false);
    const [agentStatus, setAgentStatus] = useState('Idle');
    const [agentLog, setAgentLog] = useState([]);
    const [agentProgress, setAgentProgress] = useState({ current: 0, total: 0 });
    const isAgentPausedRef = useRef(false);

    // Database State
    const [processedCompanies, setProcessedCompanies] = useState([]);
    const [isDbLoading, setIsDbLoading] = useState(false);
    const [dbError, setDbError] = useState(null);

    const fetchProcessedCompaniesFromDB = async () => {
        setIsDbLoading(true);
        setDbError(null);
        try {
            // Assuming a local API endpoint to fetch previously processed companies
            // The actual endpoint might need to be defined in ../utils/api or a separate configuration
            const response = await api.request(
                'GET',
                '/api/processed-companies' // Hypothetical endpoint
            );
            setProcessedCompanies(response.data);
        } catch (err) {
            setDbError(err.message);
            logMessage(`Error fetching processed companies: ${err.message}`);
        } finally {
            setIsDbLoading(false);
        }
    };

    useEffect(() => {
        fetchProcessedCompaniesFromDB();
    }, []);

    const logMessage = (message) => {
        setAgentLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 199)]);
    };

    const handleApiKeyChange = (key) => {
        setApiKey(key);
        sessionStorage.setItem('ch_api_key', key);
    };

    // Search companies incorporated on specific date
    const searchCompaniesByDate = async (date, startIndex = 0) => {
        try {
            const response = await api.request(
                'GET',
                `${COMPANIES_HOUSE_API_BASE}/search/companies`,
                { 
                    incorporated_from: date,
                    incorporated_to: date,
                    start_index: startIndex
                },
                { 
                    'Authorization': `Basic ${btoa(apiKey + ':')}`,
                    'Content-Type': 'application/json'
                }
            );
            return response;
        } catch (error) {
            throw new Error(`API error: ${error.message}`);
        }
    };

    // Get company profile with full details
    const getCompanyProfile = async (companyNumber) => {
        try {
            const response = await api.request(
                'GET',
                `${COMPANIES_HOUSE_API_BASE}/company/${companyNumber}`,
                {},
                {
                    'Authorization': `Basic ${btoa(apiKey + ':')}`,
                    'Content-Type': 'application/json'
                }
            );
            return response;
        } catch (error) {
            throw new Error(`Company profile error: ${error.message}`);
        }
    };

    // Get registered office address
    const getCompanyAddress = async (companyNumber) => {
        try {
            const response = await api.request(
                'GET',
                `${COMPANIES_HOUSE_API_BASE}/company/${companyNumber}/registered-office-address`,
                {},
                {
                    'Authorization': `Basic ${btoa(apiKey + ':')}`,
                    'Content-Type': 'application/json'
                }
            );
            return response;
        } catch (error) {
            // If the address is not found, the API might return a 404, which api.request will throw as an error.
            // In this case, we want to return null, not re-throw the error.
            if (error.response && error.response.status === 404) {
                return null;
            }
            return null;
        }
    };

    // Process and enrich company data
    const processCompanyData = async (companyBasic) => {
        try {
            const [profile, address] = await Promise.all([
                getCompanyProfile(companyBasic.company_number),
                getCompanyAddress(companyBasic.company_number)
            ]);

            // Construct address string
            const addressString = address ? 
                [address.address_line_1, address.address_line_2, address.locality, address.region, address.postal_code]
                    .filter(Boolean).join(', ') : 'Address not available';

            return {
                company_name: companyBasic.title,
                company_number: companyBasic.company_number,
                company_status: companyBasic.company_status,
                company_type: profile?.type,
                incorporation_date: companyBasic.date_of_creation,
                registered_address: addressString,
                
                // Accounts information
                accounts_due_date: profile?.accounts?.next_due || 'Not available',
                cs_due_date: profile?.confirmation_statement?.next_due || 'Not available',
                
                // Additional metadata
                sic_codes: profile?.sic_codes || [],
                jurisdiction: profile?.jurisdiction || 'england-wales',
                last_updated: new Date().toISOString()
            };
        } catch (error) {
            logMessage(`Error processing company ${companyBasic.company_number}: ${error.message}`);
            return null;
        }
    };

    const startAgent = async () => {
        if (!apiKey) {
            logMessage("Companies House API Key is required to start.");
            return;
        }

        setIsAgentRunning(true);
        isAgentPausedRef.current = false;
        setAgentLog([]);
        setAgentProgress({ current: 0, total: 0 });
        setProcessedCompanies([]);

        try {
            logMessage(`Starting real data collection for companies incorporated on: ${TARGET_DATE}`);
            setAgentStatus("Searching Companies House...");

            let startIndex = 0;
            const pageSize = 100;
            let totalCompanies = 0;
            let processedCount = 0;
            const allCompanies = [];

            // Initial search to get total count
            const initialResults = await searchCompaniesByDate(TARGET_DATE, 0);
            totalCompanies = initialResults.total_results;
            setAgentProgress({ current: 0, total: totalCompanies });
            
            logMessage(`Found ${totalCompanies} companies incorporated on ${TARGET_DATE}`);
            
            if (totalCompanies === 0) {
                logMessage("No companies found for the specified date.");
                setIsAgentRunning(false);
                setAgentStatus("Idle");
                return;
            }

            // Collect all companies (paginate through results)
            while (startIndex < totalCompanies && !isAgentPausedRef.current) {
                setAgentStatus(`Fetching companies ${startIndex + 1}-${Math.min(startIndex + pageSize, totalCompanies)}...`);
                
                const results = await searchCompaniesByDate(TARGET_DATE, startIndex);
                allCompanies.push(...results.items);
                startIndex += pageSize;

                // Rate limiting - be respectful to the API
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            if (isAgentPausedRef.current) {
                logMessage("Agent paused by user.");
                setAgentStatus("Paused");
                return;
            }

            // Process each company with detailed information
            setAgentStatus("Enriching company data...");
            
            const enrichedCompanies = [];

            for (const companyBasic of allCompanies) {
                if (isAgentPausedRef.current) {
                    logMessage("Agent paused by user.");
                    setAgentStatus("Paused");
                    return;
                }

                try {
                    const enrichedData = await processCompanyData(companyBasic);
                    
                    if (enrichedData) {
                        enrichedCompanies.push(enrichedData);
                        setProcessedCompanies([...enrichedCompanies]);
                    }

                    processedCount++;
                    setAgentProgress({ current: processedCount, total: totalCompanies });

                    // Log progress every 10 companies
                    if (processedCount % 10 === 0) {
                        logMessage(`Processed ${processedCount}/${totalCompanies} companies`);
                    }

                    // Rate limiting between company requests
                    await new Promise(resolve => setTimeout(resolve, 100));

                } catch (companyError) {
                    logMessage(`Failed to process company ${companyBasic.company_number}: ${companyError.message}`);
                    continue;
                }
            }

            logMessage(`Successfully processed ${processedCount} real companies from Companies House`);
            setAgentStatus("Finished");
            
        } catch (error) {
            logMessage(`Agent failed: ${error.message}`);
            setAgentStatus("Error");
        } finally {
            setIsAgentRunning(false);
        }
    };
    
    const pauseAgent = () => {
        isAgentPausedRef.current = true;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-10 h-10 text-blue-600" />
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            Live Companies House Data
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Fetch and analyze real-time company data directly from Companies House API
                    </p>
                </div>

                {/* Control Panel */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-6 h-6 text-blue-600" />
                            Real Companies House Data Collector
                        </CardTitle>
                        <CardDescription>
                            This agent will fetch real company data from the Companies House API for companies incorporated on {TARGET_DATE}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* API Key Input */}
                        <div>
                            <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                                <KeyRound className="w-4 h-4" />
                                Companies House API Key:
                            </label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => handleApiKeyChange(e.target.value)}
                                placeholder="Enter your Companies House API Key"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            {!apiKey && (
                                <p className="text-red-500 text-xs mt-1">API Key is required to fetch data.</p>
                            )}
                        </div>

                        {/* Agent Controls */}
                        <div className="flex items-center space-x-2">
                            <Button
                                onClick={startAgent}
                                disabled={isAgentRunning || !apiKey}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isAgentRunning ? (
                                    <><Loader className="mr-2 h-4 w-4 animate-spin" /> Running...</>
                                ) : (
                                    <><PlayCircle className="mr-2 h-4 w-4" /> Start Agent</>
                                )}
                            </Button>
                            <Button
                                onClick={pauseAgent}
                                disabled={!isAgentRunning}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                                <PauseCircle className="mr-2 h-4 w-4" /> Pause Agent
                            </Button>
                        </div>

                        {/* Agent Status */}
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-sm px-3 py-1">
                                Status: <span className="font-semibold ml-1">{agentStatus}</span>
                            </Badge>
                            {isAgentRunning && agentProgress.total > 0 && (
                                <Badge variant="outline" className="text-sm px-3 py-1">
                                    Progress: <span className="font-semibold ml-1">{agentProgress.current}/{agentProgress.total}</span>
                                </Badge>
                            )}
                            {isDbLoading && (
                                <Badge variant="outline" className="text-sm px-3 py-1 bg-blue-100 text-blue-800">
                                    <Loader className="mr-2 h-4 w-4 animate-spin" /> Loading DB...
                                </Badge>
                            )}
                            {dbError && (
                                <Badge variant="destructive" className="text-sm px-3 py-1">
                                    <AlertCircle className="mr-2 h-4 w-4" /> DB Error: {dbError}
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Processed Companies Display */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-6 h-6 text-green-600" />
                            Processed Companies ({processedCompanies.length})
                        </CardTitle>
                        <CardDescription>
                            List of companies fetched and enriched from Companies House.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {processedCompanies.length === 0 && !isDbLoading && !dbError ? (
                            <p className="text-gray-500 dark:text-gray-400">No companies processed yet. Start the agent to fetch data.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {processedCompanies.map((company, index) => (
                                    <Card key={index} className="p-4">
                                        <CardTitle className="text-lg mb-2 flex items-center justify-between">
                                            {company.company_name}
                                            <a 
                                                href={`https://find-and-update.company-information.service.gov.uk/company/${company.company_number}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-700"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </CardTitle>
                                        <CardDescription className="text-sm">
                                            <p><strong>Number:</strong> {company.company_number}</p>
                                            <p><strong>Status:</strong> <Badge variant="secondary">{company.company_status}</Badge></p>
                                            <p><strong>Type:</strong> {company.company_type}</p>
                                            <p><strong>Incorporated:</strong> {company.incorporation_date}</p>
                                            <p><strong>Address:</strong> {company.registered_address}</p>
                                            <p><strong>Accounts Due:</strong> {company.accounts_due_date}</p>
                                            <p><strong>CS Due:</strong> {company.cs_due_date}</p>
                                            {company.sic_codes && company.sic_codes.length > 0 && (
                                                <p><strong>SIC Codes:</strong> {company.sic_codes.join(', ')}</p>
                                            )}
                                            <p className="text-xs text-gray-400">Last Updated: {new Date(company.last_updated).toLocaleString()}</p>
                                        </CardDescription>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Agent Log */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-6 h-6 text-purple-600" />
                            Agent Log
                        </CardTitle>
                        <CardDescription>
                            Real-time logs from the data collection agent.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-4 rounded-md text-sm font-mono">
                        {agentLog.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">Agent log is empty.</p>
                        ) : (
                            agentLog.map((log, index) => (
                                <p key={index} className="text-gray-700 dark:text-gray-300">{log}</p>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}