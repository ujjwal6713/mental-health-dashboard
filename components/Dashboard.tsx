"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';


type DemographicRow = {
  subgroup: string;
  average_score: number;
  student_count: number;
  demographic_category: string;
};

type QuestionAccuracyRow = {
  Question: string;
  Accuracy: number;
  QuestionText?: string;
};

type CorrRow = {
  Question: string;
  Correlation_r: number;
};

type StudentRow = {
  campus: string;
  year: string;
  program: string;
  housing: string;
  status: string;
  mentalHealth: string;
  Q01: number;
  Q02: number;
  Q03: number;
  Q04: number;
  Q05: number;
  Q06: number;
  Q07: number;
  Q08: number;
  Q09: number;
  Q10: number;
  Q11: number;
  Q12: number;
  Q13: number;
  Q14: number;
  Q15: number;
  Q16: number;
  Q17: number;
  Q18: number;
  Q19: number;
  Q20: number;
  Q21: number;
  Total_Score: number;
  score_percent: number;
  literacy_level: number;
};

type MentalHealthRow = {
  mentalHealth: string;
  score_percent: number;
};

type FeatureImportanceRow = {
  feature: string;
  importance: number;
};

type DashboardProps = {
  userRole?: string;
};

const Dashboard = ({ userRole = 'viewer' }: DashboardProps) => {
  const [currentPage, setCurrentPage] = useState<'overview' | 'literacy' | 'crisis' | 'afterhours' | 'mentalhealth'>('overview');
  const [selectedCategory, setSelectedCategory] = useState("campus");
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const [demographicData, setDemographicData] = useState<DemographicRow[]>([]);
  const [literacyData, setLiteracyData] = useState<StudentRow[]>([]);
  const [questionAccuracy, setQuestionAccuracy] = useState<QuestionAccuracyRow[]>([]);
  const [questionLookup, setQuestionLookup] = useState<Record<string, string>>({});
  const [corrData, setCorrData] = useState<CorrRow[]>([]);
  const [mentalHealthData, setMentalHealthData] = useState<MentalHealthRow[]>([]);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportanceRow[]>([]);


  // load demographic_breakdown.json with refresh interval
  useEffect(() => {
    async function loadDemographic() {
      try {
        const res = await fetch("/data/demographic_breakdown.json?t=" + Date.now());
        const json = await res.json();
        setDemographicData(json);
      } catch (error) {
        console.error("Error loading demographic breakdown JSON:", error);
      }
    }
    loadDemographic();
    const interval = setInterval(loadDemographic, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load q_accuracy.json with refresh interval
  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch("/data/q_accuracy.json?t=" + Date.now());
        const json = await res.json();
        setQuestionAccuracy(json);
      } catch (error) {
        console.error("Error loading q_accuracy.json:", error);
      }
    }

    loadQuestions();
    const interval = setInterval(loadQuestions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadQuestionLookup() {
      try {
        const res = await fetch("/data/q_lookup.json?t=" + Date.now());
        const json = await res.json();
        const lookupObj: Record<string, string> = {};
        json.forEach((item: any) => {
          const qid = item.QID;
          const question = item.Questions;
          lookupObj[qid] = question;
          lookupObj[qid.toUpperCase()] = question;
          lookupObj[qid.toLowerCase()] = question;
        });
        setQuestionLookup(lookupObj);
      } catch (error) {
        console.error("Failed to load q_lookup.json:", error);
      }
    }

    loadQuestionLookup();
    const interval = setInterval(loadQuestionLookup, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadCorrelation() {
      try {
        const res = await fetch("/data/corr_df.json?t=" + Date.now());
        const json = await res.json();
        setCorrData(json);
      } catch (error) {
        console.error("Failed to load corr_df.json", error);
      }
    }

    loadCorrelation();
    const interval = setInterval(loadCorrelation, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadMentalHealth() {
      try {
        const res = await fetch("/data/mental_health_df.json?t=" + Date.now());
        const json = await res.json();
        setMentalHealthData(json);
      } catch (error) {
        console.error("Failed to load mental_health_df.json:", error);
      }
    }
    loadMentalHealth();
    const interval = setInterval(loadMentalHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadFeatureImportance() {
      try {
        const res = await fetch("/data/grouped_coef_df.json?t=" + Date.now());
        const json = await res.json();
        // Map to proper labels based on Python code order
        const labels = ['program', 'year', 'campus', 'housing', 'status'];
        const mappedData = json.map((item: any, index: number) => ({
          feature: labels[index] || `Feature ${index + 1}`,
          importance: parseFloat(item.Total_Coefficient.toFixed(1))
        }));
        setFeatureImportance(mappedData);
      } catch (error) {
        console.error("Failed to load grouped_coef_df.json:", error);
      }
    }
    loadFeatureImportance();
    const interval = setInterval(loadFeatureImportance, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadLiteracy() {
      try {
        const res = await fetch("/data/master_df.json?t=" + Date.now());
        const json = await res.json();
        setLiteracyData(json);
      } catch (error) {
        console.error("Failed to load master_df.json:", error);
      }
    }
    loadLiteracy();
    const interval = setInterval(loadLiteracy, 5000);
    return () => clearInterval(interval);
  }, []);


  // KPI calculations from full dataset (no filtering) - wrapped in useMemo to be reactive
  const { 
    totalStudents, 
    avgLiteracyScore, 
    crisisAwarenessRate, 
    afterHoursAwarenessRate, 
    serviceAccessRate 
  } = useMemo(() => {
    const total = literacyData.length;
    const avgScore = total > 0 
      ? literacyData.reduce((acc, row) => acc + row.score_percent, 0) / total
      : 0;
    const crisisRate = total > 0 
      ? literacyData.filter((row) => row.Q10 === 1).length / total * 100
      : 0;
    const afterHoursRate = total > 0 
      ? literacyData.filter((row) => row.Q13 === 1).length / total * 100
      : 0;
    const serviceRate = total > 0 
      ? literacyData.filter((row) => row.mentalHealth === "Yes").length / total * 100
      : 0;
    
    return {
      totalStudents: total,
      avgLiteracyScore: avgScore,
      crisisAwarenessRate: crisisRate,
      afterHoursAwarenessRate: afterHoursRate,
      serviceAccessRate: serviceRate
    };
  }, [literacyData]);

  const filteredData = useMemo(() => {
    return demographicData.filter((row) => {
      return row.demographic_category === selectedCategory;
    });
  }, [demographicData, selectedCategory]);

  const sortedQuestions = useMemo(() => {
    return [...questionAccuracy].sort((a, b) => b.Accuracy - a.Accuracy);
  }, [questionAccuracy]);
  
  // Get top 5 and bottom 5 questions - wrapped in useMemo
  const topQuestions = useMemo(() => sortedQuestions.slice(0, 5), [sortedQuestions]);
  const bottomQuestions = useMemo(() => sortedQuestions.slice(-5).reverse(), [sortedQuestions]);

  // Calculate score distribution bins
  const scoreDistribution = useMemo(() => {
    const bins = [
      { range: '0-20%', min: 0, max: 20, count: 0 },
      { range: '20-40%', min: 20, max: 40, count: 0 },
      { range: '40-60%', min: 40, max: 60, count: 0 },
      { range: '60-80%', min: 60, max: 80, count: 0 },
      { range: '80-100%', min: 80, max: 100, count: 0 }
    ];
    
    literacyData.forEach((row) => {
      const score = row.score_percent;
      bins.forEach(bin => {
        if (score >= bin.min && score <= bin.max) {
          bin.count++;
        }
      });
    });
    
    return bins;
  }, [literacyData]);

  const CustomXAxisTick = ({ x, y, payload }: any) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill="#3b82f6"
          fontSize={12}
          fontWeight="600"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setSelectedQuestion(payload.value);
          }}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  // Color scheme
  const colors = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    neutral: '#6b7280'
  };

  // KPI Card Component
  const KPICard = ({ title, value, subtitle, color = colors.primary, onClick }: any) => (
    <div 
      className="bg-white rounded-lg shadow-md p-6 border-l-4 cursor-pointer hover:shadow-lg transition-shadow" 
      style={{ borderLeftColor: color }}
      onClick={onClick}
    >
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      <p className="text-xs text-blue-600 mt-3">Click for detailed breakdown →</p>
    </div>
  );

  // Calculate demographic breakdowns for detail pages - wrapped in useCallback
  const getDetailData = useCallback((metric: string) => {
    const categories = ['campus', 'year', 'housing', 'status', 'program', 'mentalHealth'];
    const categoryLabels: Record<string, string> = {
      campus: 'Campus',
      year: 'Year',
      housing: 'Housing',
      status: 'Status',
      program: 'Program',
      mentalHealth: 'Mental Health Support'
    };

    return categories.map(cat => {
      type SubgroupStats = {
        count: number;
        total: number;
      };
      
      const subgroups = literacyData.reduce((acc: Record<string, SubgroupStats>, row) => {
        const subgroup = row[cat as keyof StudentRow] as string;
        
        // Skip "Unsure" for mentalHealth category
        if (cat === 'mentalHealth' && subgroup === 'Unsure') {
          return acc;
        }
        
        if (!acc[subgroup]) {
          acc[subgroup] = { count: 0, total: 0 };
        }
        acc[subgroup].count++;
        
        if (metric === 'literacy') {
          acc[subgroup].total += row.score_percent;
        } else if (metric === 'Q10') {
          acc[subgroup].total += row.Q10 === 1 ? 1 : 0;
        } else if (metric === 'Q13') {
          acc[subgroup].total += row.Q13 === 1 ? 1 : 0;
        } else if (metric === 'mentalHealth') {
          acc[subgroup].total += row.mentalHealth === 'Yes' ? 1 : 0;
        }
        
        return acc;
      }, {});

      const data = Object.entries(subgroups).map(([name, stats]) => ({
        name,
        value: metric === 'literacy' 
          ? parseFloat((stats.total / stats.count).toFixed(1))
          : parseFloat(((stats.total / stats.count) * 100).toFixed(1)),
        count: stats.count
      }));

      // Sort by value in descending order for program category
      if (cat === 'program') {
        data.sort((a, b) => b.value - a.value);
      }

      return {
        category: categoryLabels[cat],
        data
      };
    });
  }, [literacyData]);

  // Detail Page Component
  const DetailPage = ({ title, subtitle, metric, backColor }: any) => {
    const detailData = useMemo(() => getDetailData(metric), [metric, getDetailData]);

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setCurrentPage('overview')}
            className="mb-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium"
          >
            ← Back to Overview
          </button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-gray-600">{subtitle}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {detailData.map((section, idx) => {
              const isProgram = section.category === 'Program';
              const isMentalHealth = section.category === 'Mental Health Support';
              
              return (
                <div key={idx} className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">By {section.category}</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    {(isProgram || isMentalHealth) ? (
                      <BarChart data={section.data} layout="vertical" margin={{ left: 120 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis type="category" dataKey="name" width={150} />
                        <Tooltip
                          formatter={(value: any) => `${value}%`}
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                        />
                        <Bar dataKey="value" fill={backColor} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    ) : (
                      <BarChart data={section.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: any) => `${value}%`}
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                        />
                        <Bar dataKey="value" fill={backColor} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                  <div className="mt-4">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2">{section.category}</th>
                          <th className="text-right p-2">Value</th>
                          <th className="text-right p-2">Students</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.data.map((item, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{item.name}</td>
                            <td className="text-right p-2 font-semibold">{item.value}%</td>
                            <td className="text-right p-2 text-gray-600">{item.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render based on current page
  if (currentPage === 'literacy') {
    return <DetailPage 
      title="Average Literacy Score" 
      subtitle="Detailed breakdown by demographic groups"
      metric="literacy"
      backColor={colors.primary}
    />;
  }

  if (currentPage === 'crisis') {
    return <DetailPage 
      title="Crisis Pathway Awareness (Q10)" 
      subtitle="Students who know how to access crisis services"
      metric="Q10"
      backColor={colors.success}
    />;
  }

  if (currentPage === 'afterhours') {
    return <DetailPage 
      title="After-Hours Awareness (Q13)" 
      subtitle="Awareness of after-hours mental health resources"
      metric="Q13"
      backColor={colors.warning}
    />;
  }

  if (currentPage === 'mentalhealth') {
    return <DetailPage 
      title="Mental Health Support Access" 
      subtitle="Students with mental health support"
      metric="mentalHealth"
      backColor={colors.secondary}
    />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Student Mental Health Literacy Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time insights into student mental health knowledge and resource awareness
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Average Literacy Score"
            value={`${avgLiteracyScore.toFixed(1)}%`}
            subtitle={`Based on ${totalStudents} responses`}
            color={colors.primary}
            onClick={() => setCurrentPage('literacy')}
          />
          <KPICard
            title="Crisis Pathway Awareness"
            value={`${crisisAwarenessRate.toFixed(1)}%`}
            subtitle="Know how to access crisis services"
            color={colors.success}
            onClick={() => setCurrentPage('crisis')}
          />
          <KPICard
            title="After-Hours Awareness"
            value={`${afterHoursAwarenessRate.toFixed(1)}%`}
            subtitle="988 & GuardMe familiarity"
            color={colors.warning}
            onClick={() => setCurrentPage('afterhours')}
          />
          <KPICard
            title="Service Access Rate"
            value={`${serviceAccessRate.toFixed(1)}%`}
            subtitle="Have used campus services"
            color={colors.secondary}
            onClick={() => setCurrentPage('mentalhealth')}
          />
        </div>

        {/* Demographic Breakdown Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Average Score by Demographic
            </h2>
            <div className="flex gap-2">
              {['campus', 'year', 'housing', 'status'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={filteredData} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="subgroup" width={150} />
              <Tooltip
                formatter={(value) => `${Number(value).toFixed(2)}%`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="average_score" fill={colors.primary} radius={[0, 4, 4, 0]}>
                {filteredData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.average_score > 90 ? colors.success :
                      entry.average_score > 80 ? colors.primary : colors.warning}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: colors.success }}></div>
              <span>High (&gt;90%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: colors.primary }}></div>
              <span>Medium (80-90%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: colors.warning }}></div>
              <span>Low (&lt;80%)</span>
            </div>
          </div>
        </div>

        {/* Question Performance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top 5 Questions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Top 5 Questions
              <span className="block text-sm font-normal text-gray-600 mt-1">
                Highest correct answer rates (Click question ID to see full text)
              </span>
            </h2>
            {selectedQuestion && (
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-sm font-semibold text-blue-900 mb-1">{selectedQuestion}</p>
                <p className="text-sm text-gray-700">
                  {questionLookup[selectedQuestion] || questionLookup[selectedQuestion.toUpperCase()] || `Question text not found for ${selectedQuestion}`}
                </p>
              </div>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topQuestions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Question" tick={<CustomXAxisTick />} />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value) => `${value}%`}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="Accuracy" fill={colors.success} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom 5 Questions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Bottom 5 Questions
              <span className="block text-sm font-normal text-gray-600 mt-1">
                Lowest correct answer rates - knowledge gaps (Click question ID to see full text)
              </span>
            </h2>
            {selectedQuestion && (
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-sm font-semibold text-blue-900 mb-1">{selectedQuestion}</p>
                <p className="text-sm text-gray-700">
                  {questionLookup[selectedQuestion] || questionLookup[selectedQuestion.toUpperCase()] || `Question text not found for ${selectedQuestion}`}
                </p>
              </div>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bottomQuestions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Question" tick={<CustomXAxisTick />} />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value) => `${value}%`}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="Accuracy" fill={colors.danger} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Distribution & Feature Importance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Score Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Score Distribution
              <span className="block text-sm font-normal text-gray-600 mt-1">
                How student scores are distributed across ranges
              </span>
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="count" fill={colors.primary} radius={[4, 4, 0, 0]}>
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      index === 0 ? colors.danger :
                      index === 1 ? colors.warning :
                      index === 2 ? colors.neutral :
                      index === 3 ? colors.primary : colors.success
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Insight:</strong> This shows whether students cluster at high scores or if there's a wide spread. Identifies if interventions are needed for low-performing groups.
              </p>
            </div>
          </div>

          {/* Feature Importance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Predictors of Low Literacy (Logistic Regression - 81% Accuracy)
              <span className="block text-sm font-normal text-gray-600 mt-1">
                Which demographics most strongly predict literacy scores
              </span>
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureImportance} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="feature" width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="importance" fill={colors.secondary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Insight:</strong> These demographics have the strongest predictive power for identifying students at risk of low mental health literacy. Target interventions accordingly.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Literacy Score Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Literacy Score by Mental Health Support
              <span className="block text-sm font-normal text-gray-600 mt-1">
                Comparison between students with and without mental health support
              </span>
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mentalHealthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mentalHealth" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value) => `${Number(value).toFixed(2)}%`}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="score_percent" fill={colors.secondary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Insight:</strong> Students who reported having mental health support show a slightly higher literacy score. This may reflect the positive impact of support systems.
              </p>
            </div>
          </div>

          {/* Correlation Heatmap Side-by-Side */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Correlation with Literacy Score</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={corrData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[-1, 1]} />
                <YAxis type="category" dataKey="Question" />
                <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                <Bar dataKey="Correlation_r" radius={[0, 4, 4, 0]}>
                  {corrData.map((entry, index) => {
                    let color = "#d1d5db";
                    if (entry.Correlation_r >= 0.3) color = "#10b981";
                    else if (entry.Correlation_r <= -0.3) color = "#ef4444";
                    else color = "#f59e0b";

                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-gray-600 flex gap-4 justify-center">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-500"></div> High Positive</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-yellow-500"></div> Neutral</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500"></div> High Negative</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Dashboard updated in real-time | Total Responses: {totalStudents}</p>
          <p className="mt-2">Algoma University Mental Health Literacy Survey</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;