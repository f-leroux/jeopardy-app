import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, Linking, ScrollView } from 'react-native';
import questionsData from './data/full/jeopardy_questions.json';

function renderTextWithItalics(text) {
  const parts = text.split(/(<i>|<\/i>)/g);
  const result = [];
  let italic = false;
  parts.forEach((part, index) => {
    if (part === '<i>') {
      italic = true;
    } else if (part === '</i>') {
      italic = false;
    } else if (part !== '') {
      result.push(
        <Text key={index} style={italic ? styles.italic : undefined}>{part}</Text>
      );
    }
  });
  return result;
}

export default function App() {
  const [categoryIndex, setCategoryIndex] = useState(() => Math.floor(Math.random() * questionsData.length));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const category = questionsData[categoryIndex];
  const questionObj = category.questions[questionIndex];

  const nextQuestion = () => {
    setQuestionIndex((prev) => (prev + 1) % category.questions.length);
    setShowAnswer(false);
  };

  const prevQuestion = () => {
    setQuestionIndex((prev) => (prev - 1 + category.questions.length) % category.questions.length);
    setShowAnswer(false);
  };

  const newCategory = () => {
    setCategoryIndex(Math.floor(Math.random() * questionsData.length));
    setQuestionIndex(0);
    setShowAnswer(false);
  };

  const handleAnswerPress = () => {
    if (questionObj.wiki_slug) {
      Linking.openURL(`https://en.wikipedia.org/wiki/${questionObj.wiki_slug}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.category}>{category.category.replace(/^"|"$/g, '')}</Text>
      <ScrollView style={styles.questionContainer}>
        <Text style={styles.question}>{renderTextWithItalics(questionObj.q)}</Text>
        {showAnswer && (
          <TouchableOpacity onPress={handleAnswerPress}>
            <Text style={styles.answer}>{renderTextWithItalics(questionObj.a)}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <View style={styles.buttonsRow}>
        <Button title="Prev" onPress={prevQuestion} />
        <Button
          title={showAnswer ? 'Hide Answer' : 'Show Answer'}
          onPress={() => setShowAnswer(!showAnswer)}
        />
        <Button title="Next" onPress={nextQuestion} />
      </View>
      <View style={styles.newCategory}>
        <Button title="New Category" onPress={newCategory} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  category: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  questionContainer: { flex: 1 },
  question: { fontSize: 20, marginBottom: 20 },
  answer: { fontSize: 20, marginBottom: 20, color: 'blue' },
  italic: { fontStyle: 'italic' },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  newCategory: { marginTop: 10 }
});
