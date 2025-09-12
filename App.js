import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, ScrollView } from 'react-native';
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
    if (questionIndex < category.questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      setShowAnswer(false);
    }
  };

  const prevQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
      setShowAnswer(false);
    }
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
      <ScrollView contentContainerStyle={styles.questionContainer} style={styles.questionScroll}>
        <Text style={styles.question}>{renderTextWithItalics(questionObj.q)}</Text>
        {showAnswer && (
          <>
            <View style={styles.separator} />
            <TouchableOpacity onPress={handleAnswerPress} disabled={!questionObj.wiki_slug}>
              <Text
                style={[
                  styles.answer,
                  { color: questionObj.wiki_slug ? 'blue' : 'black' }
                ]}
              >
                {renderTextWithItalics(questionObj.a)}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.button, questionIndex === 0 && styles.disabledButton]}
          onPress={prevQuestion}
          disabled={questionIndex === 0}
        >
          <Text style={styles.buttonText}>Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => setShowAnswer(!showAnswer)}>
          <Text style={styles.buttonText}>{showAnswer ? 'Hide Answer' : 'Show Answer'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, questionIndex === category.questions.length - 1 && styles.disabledButton]}
          onPress={nextQuestion}
          disabled={questionIndex === category.questions.length - 1}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.newCategory}>
        <TouchableOpacity style={[styles.button, styles.newCategoryButton]} onPress={newCategory}>
          <Text style={styles.buttonText}>New Category</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 20,
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: '#f0f0f5'
  },
  category: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30
  },
  questionScroll: {
    flex: 0.85,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 10
  },
  questionContainer: { flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center' },
  question: { fontSize: 20, marginBottom: 20, textAlign: 'center', marginTop: 40 },
  separator: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 10 },
  answer: { fontSize: 20, marginBottom: 20, textAlign: 'center' },
  italic: { fontStyle: 'italic' },
  buttonsRow: { flexDirection: 'row', marginBottom: 10 },
  button: {
    flex: 1,
    marginHorizontal: 2,
    backgroundColor: '#2196F3',
    borderRadius: 5,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabledButton: { backgroundColor: '#a0a0a0' },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 18 },
  newCategory: { marginTop: 5 },
  newCategoryButton: {
    height: 70,
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
