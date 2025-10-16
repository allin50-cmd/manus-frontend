import React, { useState, useEffect, useRef } from 'react';
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
    
    const logMessage = (message) => {
        setAgentLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 199)]);
    };

    const handleApiKeyChange = (key) => {
        setApiKey(key);
        sessionStorage.setItem('ch_api_key', key);
    };

    // Search companies incorporated on specific date
    const searchCompaniesByDate = async (date, startIndex = 0) => {
        const response = await fetch(
            `${COMPANIES_HOUSE_API_BASE}/search/companies?incorporated_from=${date}&incorporated_to=${date}&start_index=${startIndex}`,
            {
                headers: {
                    'Authorization': `Basic ${btoa(apiKey + ':')}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    };

    // Get company profile with full details
    const getCompanyProfile = async (companyNumber) => {
        const response = await fetch(
            `${COMPANIES_HOUSE_API_BASE}/company/${companyNumber}`,
            {
                headers: {
                    'Authorization': `Basic ${btoa(apiKey + ':')}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Company profile error: ${response.status}`);
        }

        return await response.json();
    };

    // Get registered office address
    const getCompanyAddress = async (companyNumber) => {
        try {
            const response = await fetch(
                `${COMPANIES_HOUSE_API_BASE}/company/${companyNumber}/registered-office-address`,
                {
                    headers: {
                        'Authorization': `Basic ${btoa(apiKey + ':')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                return null;
            }

            return await response.json();
        } catch {
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
                                Companies House API Key
                            </label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    value={apiKey} 
                                    onChange={(e) => handleApiKeyChange(e.target.value)} 
                                    placeholder="Enter your Companies House API key" 
                                    className="w-full p-3 border rounded-lg bg-background pr-10"
                                />
                                {apiKey.length > 0 && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Get your API key from: <a href="https://developer.company-information.service.gov.uk/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Companies House Developer Portal</a>
                            </p>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex items-center gap-4">
                            {!isAgentRunning ? (
                                <Button 
                                    onClick={startAgent} 
                                    disabled={!apiKey} 
                                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                                >
                                    <PlayCircle className="w-5 h-5 mr-2" /> Start Live Data Collection
                                </Button>
                            ) : (
                                <Button 
                                    onClick={pauseAgent} 
                                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                                >
                                    <PauseCircle className="w-5 h-5 mr-2" /> Pause Collection
                                </Button>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div>
                            <div className="flex justify-between items-center text-sm font-semibold mb-2">
                                <span>Status: <Badge variant="outline">{agentStatus}</Badge></span>
                                <span className="text-gray-500">{agentProgress.current} / {agentProgress.total}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500" 
                                    style={{ width: agentProgress.total > 0 ? `${(agentProgress.current / agentProgress.total) * 100}%` : '0%' }}
                                ></div>
                            </div>
                        </div>

                        {/* Agent Log */}
                        <div className="bg-gray-900 text-green-400 font-mono text-xs rounded-lg p-4 h-48 overflow-y-auto">
                            {agentLog.length > 0 ? agentLog.map((msg, i) => <p key={i} className="whitespace-pre-wrap">{msg}</p>) : <p className="text-gray-500">Agent log will appear here...</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Results Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-6 h-6 text-blue-600" />
                            Live Company Database
                        </CardTitle>
                        <CardDescription>
                            Real-time company data from Companies House
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isDbLoading ? (
                            <div className="text-center p-8">
                                <Loader className="w-8 h-8 animate-spin mx-auto text-blue-500"/>
                                <p className="text-gray-500 mt-2">Loading company data...</p>
                            </div>
                        ) : dbError ? (
                            <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-center">{dbError}</div>
                        ) : processedCompanies.length === 0 ? (
                            <div className="text-center text-gray-500 p-8">
                                <Database className="w-12 h-12 mx-auto text-gray-300 mb-2"/>
                                <p>No data yet. Start the agent to collect real company data.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Company Name & Number</th>
                                            <th className="px-4 py-3 text-left">Status</th>
                                            <th className="px-4 py-3 text-left">Registered Address</th>
                                            <th className="px-4 py-3 text-left">Accounts Due</th>
                                            <th className="px-4 py-3 text-left">CS Due</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {processedCompanies.map((company, index) => (
                                            <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">{company.company_name}</div>
                                                    <div className="font-mono text-xs text-gray-500">{company.company_number}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={
                                                        company.company_status === 'active' ? 'default' :
                                                        company.company_status === 'dissolved' ? 'destructive' :
                                                        'secondary'
                                                    }>
                                                        {company.company_status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-xs max-w-xs truncate" title={company.registered_address}>
                                                    {company.registered_address}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-red-600 dark:text-red-400 font-bold text-xs">
                                                    {company.accounts_due_date}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                    {company.cs_due_date}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

